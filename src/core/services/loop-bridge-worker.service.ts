import { spawn } from "child_process";
import { readBridgeRequest, writeBridgeResponse } from "./loop-bridge.service";
import { publishTaskLog } from "./loop-logs.service";
import { getProjects } from "./loop-projects.service";

// Auto-fulfill the IDE bridge: when a chat/collaborate request is written to
// .antigravity/bridge-<taskId>.json (keyless mode) and an agent is selected —
// per-project (project.autoAgent) or via the LOOP_BRIDGE_AUTO env default —
// spawn that agent locally in READ-ONLY mode, capture its reply (which contains
// <file_edit> blocks), and write it back as status "done". The existing bridge
// POST route then applies those edits through the guarded applyFileEdits path —
// so this worker never writes project files itself.
//
// Off by default: with no agent selected the bridge waits for a human. Only
// registered adapters may ever be spawned (no arbitrary command).

const TIMEOUT_MS = 4 * 60 * 1000; // under the client's ~5-min poll window

// Read-only fulfillment contract. Note this DIFFERS from the human bridge
// instructions (which tell the agent to edit files directly): the auto worker is
// read-only, so the agent must return edits as text for the app to apply.
const WORKER_SYSTEM =
    "You are fulfilling a Loop Studio coding request in READ-ONLY mode. Analyze the " +
    "repository (read/search only) and reply with your solution. To propose file " +
    "changes, output the ENTIRE file body for each changed file inside " +
    '<file_edit path="relative/path">...</file_edit> blocks. Do NOT edit files or run ' +
    "commands yourself — the host application applies your <file_edit> blocks.";

interface AgentAdapter {
    bin: string;
    /** argv for a headless, read-only run. `system` is the read-only contract. */
    buildArgs: (prompt: string, system: string) => string[];
    /** Extract the reply text from the agent's stdout; throw on error/parse failure. */
    parse: (stdout: string) => string;
}

// Registered adapters. The allow-list is exactly Object.keys(ADAPTERS) — env or a
// per-project setting names one of these; anything else is rejected.
const ADAPTERS: Record<string, AgentAdapter> = {
    // claude v2.1.210. No --bare: use the machine's Claude Code login (keyless).
    // dontAsk + read-only allowedTools aborts (never prompts/hangs) on any write.
    claude: {
        bin: "claude",
        buildArgs: (prompt, system) => [
            "-p", prompt,
            "--permission-mode", "dontAsk",
            "--allowedTools", "Read,Grep,Glob",
            "--output-format", "json",
            "--append-system-prompt", system,
        ],
        parse: (stdout) => {
            // claude -p --output-format json emits an ARRAY of events; the final
            // { type:"result" } element holds the answer + an is_error flag. (A bare
            // { result } object is also tolerated for forward/backward compatibility.)
            type ResultEvent = { type?: string; result?: unknown; is_error?: boolean };
            const data: unknown = JSON.parse(stdout);
            const events = (Array.isArray(data) ? data : [data]) as ResultEvent[];
            const result =
                [...events].reverse().find((e) => e && typeof e === "object" && e.type === "result") ??
                (!Array.isArray(data) ? (data as ResultEvent) : undefined);
            if (!result) throw new Error("no result element in JSON output");
            if (result.is_error) throw new Error("agent reported an error");
            if (typeof result.result !== "string") throw new Error("missing 'result' text in JSON output");
            return result.result;
        },
    },
    // gemini v0.49.0. --approval-mode plan = read-only; --skip-trust bypasses the
    // folder-trust gate for this run. No --append-system-prompt flag, so the
    // read-only contract is prepended to the prompt. Uses GEMINI_API_KEY.
    gemini: {
        bin: "gemini",
        buildArgs: (prompt, system) => [
            "-p", `${system}\n\n${prompt}`,
            "--approval-mode", "plan",
            "--skip-trust",
            "--output-format", "json",
        ],
        parse: (stdout) => {
            const data = JSON.parse(stdout) as { response?: unknown };
            if (typeof data.response !== "string") throw new Error("missing 'response' in JSON output");
            return data.response;
        },
    },
};

/** The env-level default auto-fulfill agent name, or null when unset. */
export function bridgeAutoAgent(): string | null {
    return (process.env.LOOP_BRIDGE_AUTO || "").trim() || null;
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function buildPrompt(prompt: string, history?: unknown[]): string {
    if (!Array.isArray(history) || history.length === 0) return prompt;
    const rendered = history
        .map((m) => {
            const r = m as { senderName?: string; role?: string; content?: string };
            if (!r || typeof r.content !== "string") return "";
            return `${r.senderName || r.role || "user"}: ${r.content}`;
        })
        .filter(Boolean)
        .join("\n");
    return rendered ? `${prompt}\n\nConversation so far:\n${rendered}` : prompt;
}

/**
 * Fulfill a task's pending bridge request with a local agent. No-op when no agent
 * is selected (per-project setting → env default), when the request id no longer
 * matches, or when the selected agent isn't registered. Fire-and-forget from the
 * chat/collaborate routes; the client keeps polling.
 */
export async function autoFulfillBridge(taskId: string, bridgeId: string): Promise<void> {
    const bridge = readBridgeRequest(taskId);
    if (!bridge || bridge.id !== bridgeId || bridge.status !== "pending") return;

    const project = getProjects().find((p) => p.id === bridge.projectId);
    if (!project) {
        writeBridgeResponse(taskId, bridgeId, { status: "error", error: "Project not found for bridge request." });
        return;
    }

    // Per-project choice wins over the LOOP_BRIDGE_AUTO env default.
    const agentName = (project.autoAgent || bridgeAutoAgent() || "").trim();
    if (!agentName) return; // disabled → human fulfills the bridge (default)

    const adapter = ADAPTERS[agentName];
    if (!adapter) {
        publishTaskLog(taskId, `\n[auto-bridge] agent "${agentName}" is not registered (available: ${Object.keys(ADAPTERS).join(", ")}).\n`);
        writeBridgeResponse(taskId, bridgeId, { status: "error", error: `Auto-bridge agent "${agentName}" is not registered.` });
        return;
    }

    const prompt = buildPrompt(bridge.prompt, bridge.history);
    publishTaskLog(taskId, `\n[auto-bridge] ${adapter.bin} (read-only) fulfilling ${bridge.requestType} request…\n`);

    let stdout = "";
    let stderr = "";
    await new Promise<void>((resolve) => {
        const proc = spawn(adapter.bin, adapter.buildArgs(prompt, WORKER_SYSTEM), { cwd: project.path, shell: false });

        const timer = setTimeout(() => {
            publishTaskLog(taskId, `[auto-bridge] timed out after ${TIMEOUT_MS / 1000}s — killing ${adapter.bin}.\n`);
            try { proc.kill("SIGTERM"); } catch { /* already gone */ }
            writeBridgeResponse(taskId, bridgeId, { status: "error", error: "Auto-bridge timed out." });
            resolve();
        }, TIMEOUT_MS);

        let settled = false;
        const finish = () => { if (settled) return; settled = true; clearTimeout(timer); resolve(); };

        proc.stdout?.on("data", (c: Buffer) => { stdout += c.toString(); });
        proc.stderr?.on("data", (c: Buffer) => { const s = c.toString(); stderr += s; publishTaskLog(taskId, s); });

        proc.on("error", (err) => {
            writeBridgeResponse(taskId, bridgeId, { status: "error", error: `Failed to run ${adapter.bin}: ${err.message}` });
            publishTaskLog(taskId, `[auto-bridge] spawn error: ${err.message}\n`);
            finish();
        });

        proc.on("close", (code) => {
            if (code !== 0) {
                writeBridgeResponse(taskId, bridgeId, { status: "error", error: `${adapter.bin} exited with code ${code}. ${stderr.slice(0, 500)}` });
                publishTaskLog(taskId, `[auto-bridge] ${adapter.bin} exited ${code}.\n`);
                return finish();
            }
            try {
                const response = adapter.parse(stdout);
                writeBridgeResponse(taskId, bridgeId, { status: "done", response });
                publishTaskLog(taskId, `[auto-bridge] done — reply ready.\n`);
            } catch (e) {
                writeBridgeResponse(taskId, bridgeId, { status: "error", error: `Could not parse ${adapter.bin} output: ${errMsg(e)}` });
                publishTaskLog(taskId, `[auto-bridge] parse error: ${errMsg(e)}\n`);
            }
            finish();
        });
    });
}
