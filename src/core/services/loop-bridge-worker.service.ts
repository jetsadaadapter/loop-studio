import { spawn } from "child_process";
import { readBridgeRequest, writeBridgeResponse } from "./loop-bridge.service";
import { publishTaskLog } from "./loop-logs.service";
import { getProjects } from "./loop-projects.service";

// Auto-fulfill the IDE bridge: when a chat/collaborate request is written to
// .antigravity/bridge.json (keyless mode) and LOOP_BRIDGE_AUTO names an
// allow-listed agent, spawn that agent locally in READ-ONLY mode, capture its
// reply (which contains <file_edit> blocks), and write it back as status "done".
// The existing bridge POST route then applies those edits through the guarded
// applyFileEdits path — so this worker never writes project files itself.
//
// Off by default: with LOOP_BRIDGE_AUTO unset, the bridge waits for a human as
// before. Only allow-listed binaries may ever be spawned (no arbitrary command).

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

interface AgentSpec {
    bin: string;
    args: (prompt: string) => string[];
    parse: (stdout: string) => string;
}

// Allow-listed agents. Phase 1: claude only (flags verified for CLI v2.1.210).
const AGENTS: Record<string, AgentSpec> = {
    claude: {
        bin: "claude",
        // No --bare: use the machine's Claude Code login (keyless, no API key).
        // dontAsk + read-only allowedTools: aborts (never prompts/hangs) if the
        // agent tries to write or run anything.
        args: (prompt) => [
            "-p", prompt,
            "--permission-mode", "dontAsk",
            "--allowedTools", "Read,Grep,Glob",
            "--output-format", "json",
            "--append-system-prompt", WORKER_SYSTEM,
        ],
        parse: (stdout) => {
            // `claude -p --output-format json` emits an ARRAY of events; the final
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
};

/** The configured auto-fulfill agent name, or null when disabled. */
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
 * Fulfill a pending bridge request with a local agent. No-op when disabled, when
 * the request id no longer matches, or when the agent isn't allow-listed.
 * Fire-and-forget from the chat/collaborate routes; the client keeps polling.
 */
export async function autoFulfillBridge(bridgeId: string): Promise<void> {
    const agentName = bridgeAutoAgent();
    if (!agentName) return; // disabled → human fulfills the bridge (default)

    const bridge = readBridgeRequest();
    if (!bridge || bridge.id !== bridgeId || bridge.status !== "pending") return;
    const { taskId } = bridge;

    const spec = AGENTS[agentName];
    if (!spec) {
        publishTaskLog(taskId, `\n[auto-bridge] LOOP_BRIDGE_AUTO="${agentName}" is not allow-listed (allowed: ${Object.keys(AGENTS).join(", ")}).\n`);
        writeBridgeResponse(bridgeId, { status: "error", error: `Auto-bridge agent "${agentName}" is not allow-listed.` });
        return;
    }

    const project = getProjects().find((p) => p.id === bridge.projectId);
    if (!project) {
        writeBridgeResponse(bridgeId, { status: "error", error: "Project not found for bridge request." });
        return;
    }

    const prompt = buildPrompt(bridge.prompt, bridge.history);
    publishTaskLog(taskId, `\n[auto-bridge] ${spec.bin} (read-only) fulfilling ${bridge.requestType} request…\n`);

    let stdout = "";
    let stderr = "";
    // writeBridgeResponse is itself id-guarded, so a stale result is dropped
    // automatically if a newer request replaced this single-slot bridge.
    await new Promise<void>((resolve) => {
        const proc = spawn(spec.bin, spec.args(prompt), { cwd: project.path, shell: false });

        const timer = setTimeout(() => {
            publishTaskLog(taskId, `[auto-bridge] timed out after ${TIMEOUT_MS / 1000}s — killing ${spec.bin}.\n`);
            try { proc.kill("SIGTERM"); } catch { /* already gone */ }
            writeBridgeResponse(bridgeId, { status: "error", error: "Auto-bridge timed out." });
            resolve();
        }, TIMEOUT_MS);

        let settled = false;
        const finish = () => { if (settled) return; settled = true; clearTimeout(timer); resolve(); };

        proc.stdout?.on("data", (c: Buffer) => { stdout += c.toString(); });
        proc.stderr?.on("data", (c: Buffer) => { const s = c.toString(); stderr += s; publishTaskLog(taskId, s); });

        proc.on("error", (err) => {
            writeBridgeResponse(bridgeId, { status: "error", error: `Failed to run ${spec.bin}: ${err.message}` });
            publishTaskLog(taskId, `[auto-bridge] spawn error: ${err.message}\n`);
            finish();
        });

        proc.on("close", (code) => {
            if (code !== 0) {
                writeBridgeResponse(bridgeId, { status: "error", error: `${spec.bin} exited with code ${code}. ${stderr.slice(0, 500)}` });
                publishTaskLog(taskId, `[auto-bridge] ${spec.bin} exited ${code}.\n`);
                return finish();
            }
            try {
                const response = spec.parse(stdout);
                writeBridgeResponse(bridgeId, { status: "done", response });
                publishTaskLog(taskId, `[auto-bridge] done — reply ready.\n`);
            } catch (e) {
                writeBridgeResponse(bridgeId, { status: "error", error: `Could not parse ${spec.bin} output: ${errMsg(e)}` });
                publishTaskLog(taskId, `[auto-bridge] parse error: ${errMsg(e)}\n`);
            }
            finish();
        });
    });
}
