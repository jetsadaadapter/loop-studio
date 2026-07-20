import { spawn } from "child_process";
import { readBridgeRequest, writeBridgeResponse } from "./loop-bridge.service";
import { finalizeBridgeReply } from "./loop-bridge-apply.service";
import { publishTaskLog } from "./loop-logs.service";
import { getProjects } from "./loop-projects.service";
import { runAgentInTmux, tmuxAvailable, pollTmuxRun, listTmuxRunDirs, readTmuxMeta, readTmuxOutcome, tmuxSessionAlive, cleanupTmuxRun } from "./loop-tmux.service";

type RunResult = { exitCode: number; stdout: string; timedOut: boolean };

/** LOOP_BRIDGE_TMUX opt-in: run the agent inside a tmux session (attachable,
 *  survives an app restart) instead of as a direct child. Falls back to a direct
 *  spawn if tmux isn't installed. */
function tmuxModeEnabled(): boolean {
    const v = (process.env.LOOP_BRIDGE_TMUX || "").trim();
    return (v === "1" || v === "true") && tmuxAvailable();
}

/** Run the agent as a direct child, capturing stdout; stderr streams to onLog. */
function runAgentDirect(bin: string, args: string[], cwd: string, timeoutMs: number, onLog: (s: string) => void): Promise<RunResult> {
    return new Promise((resolve) => {
        let stdout = "";
        let settled = false;
        const done = (r: RunResult) => { if (!settled) { settled = true; resolve(r); } };
        const proc = spawn(bin, args, { cwd, shell: false });
        const timer = setTimeout(() => {
            try { proc.kill("SIGTERM"); } catch { /* gone */ }
            done({ exitCode: 1, stdout: "", timedOut: true });
        }, timeoutMs);
        proc.stdout?.on("data", (c: Buffer) => { stdout += c.toString(); });
        proc.stderr?.on("data", (c: Buffer) => onLog(c.toString()));
        proc.on("error", (err) => { clearTimeout(timer); onLog(`[auto-bridge] spawn error: ${err.message}\n`); done({ exitCode: 1, stdout: "", timedOut: false }); });
        proc.on("close", (code) => { clearTimeout(timer); done({ exitCode: code ?? 0, stdout, timedOut: false }); });
    });
}

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

// A read-only CLI spawned per bridge; returns <file_edit> blocks the app applies.
interface SpawnAdapter {
    kind: "spawn";
    bin: string;
    /** argv for a headless, read-only run. `system` is the read-only contract. */
    buildArgs: (prompt: string, system: string) => string[];
    /** Extract the reply text from the agent's stdout; throw on error/parse failure. */
    parse: (stdout: string) => string;
}

/** What an SDK adapter's agentic run returns — its edits are ALREADY applied +
 *  checkpointed in the task worktree (see docs/sdk-adapter-wiring.md), so the
 *  reply is a summary + the list of files it touched. */
export interface SdkRunResult {
    summary: string;
    editedFiles: string[];
    testsPassed?: boolean;
}

// An in-process agentic loop (Agent SDK) that applies its own edits through the
// guarded tools. The concrete `claude-sdk` adapter is registered in Step 3.4.
interface SdkAdapter {
    kind: "sdk";
    run: (args: { taskId: string; projectId: string; prompt: string; onLog: (s: string) => void }) => Promise<SdkRunResult>;
}

type AgentAdapter = SpawnAdapter | SdkAdapter;

// Registered adapters. The allow-list is exactly Object.keys(ADAPTERS) — env or a
// per-project setting names one of these; anything else is rejected.
const ADAPTERS: Record<string, AgentAdapter> = {
    // claude v2.1.210. No --bare: use the machine's Claude Code login (keyless).
    // dontAsk + read-only allowedTools aborts (never prompts/hangs) on any write.
    claude: {
        kind: "spawn",
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
        kind: "spawn",
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
    // In-process agentic loop via the Agent SDK. Lazy-imported so the SDK's native
    // binary only loads when this adapter is actually used (not on every boot).
    "claude-sdk": {
        kind: "sdk",
        run: (args) => import("./loop-sdk-runner").then((m) => m.runAgentSdk(args)),
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
    const onLog = (s: string) => publishTaskLog(taskId, s);

    // SDK adapters run an in-process agentic loop and apply edits themselves.
    if (adapter.kind === "sdk") {
        await runSdkAdapter(adapter, { taskId, bridgeId, projectId: project.id, prompt, onLog });
        return;
    }

    // Spawn adapters: run a read-only CLI, then apply its <file_edit> reply.
    const args = adapter.buildArgs(prompt, WORKER_SYSTEM);
    const useTmux = tmuxModeEnabled();
    publishTaskLog(taskId, `\n[auto-bridge] ${adapter.bin} (read-only${useTmux ? ", tmux" : ""}) fulfilling ${bridge.requestType} request…\n`);

    const result = useTmux
        ? await runAgentInTmux({ taskId, bin: adapter.bin, args, cwd: project.path, timeoutMs: TIMEOUT_MS, onLog, meta: { projectId: project.id, bridgeId, agent: agentName } })
        : await runAgentDirect(adapter.bin, args, project.path, TIMEOUT_MS, onLog);

    finalizeAgentRun(taskId, bridgeId, adapter, result);
}

/** Run an SDK adapter's agentic loop and finalize its reply. The adapter applies +
 *  checkpoints its edits in the task worktree itself, so we record the summary +
 *  the pre-applied files (finalizeBridgeReply does NOT re-apply). Exported for tests. */
export async function runSdkAdapter(
    adapter: SdkAdapter,
    args: { taskId: string; bridgeId: string; projectId: string; prompt: string; onLog: (s: string) => void },
): Promise<void> {
    const { taskId, bridgeId, projectId, prompt, onLog } = args;
    onLog(`\n[auto-bridge] SDK agent fulfilling request…\n`);
    try {
        const result = await adapter.run({ taskId, projectId, prompt, onLog });
        finalizeBridgeReply(projectId, taskId, bridgeId, {
            reply: result.summary,
            senderName: "Agent (SDK)",
            preAppliedFiles: result.editedFiles,
        });
        onLog(`[auto-bridge] done — ${result.editedFiles.length} file(s) applied in the worktree.\n`);
    } catch (e) {
        writeBridgeResponse(taskId, bridgeId, { status: "error", error: errMsg(e) });
        onLog(`[auto-bridge] SDK run failed: ${errMsg(e)}\n`);
    }
}

/** Turn a runner result into a bridge response — shared by fresh runs and by
 *  post-restart recovery. id-guarded write, so a stale/superseded run can't clobber. */
function finalizeAgentRun(taskId: string, bridgeId: string, adapter: SpawnAdapter, result: RunResult): void {
    if (result.timedOut) {
        writeBridgeResponse(taskId, bridgeId, { status: "error", error: "Auto-bridge timed out." });
        return;
    }
    if (result.exitCode !== 0) {
        writeBridgeResponse(taskId, bridgeId, { status: "error", error: `${adapter.bin} exited with code ${result.exitCode}.` });
        publishTaskLog(taskId, `[auto-bridge] ${adapter.bin} exited ${result.exitCode}.\n`);
        return;
    }
    try {
        const response = adapter.parse(result.stdout);
        writeBridgeResponse(taskId, bridgeId, { status: "done", response });
        publishTaskLog(taskId, `[auto-bridge] done — reply ready.\n`);
    } catch (e) {
        writeBridgeResponse(taskId, bridgeId, { status: "error", error: `Could not parse ${adapter.bin} output: ${errMsg(e)}` });
        publishTaskLog(taskId, `[auto-bridge] parse error: ${errMsg(e)}\n`);
    }
}

/**
 * On boot, finalize tmux auto-fulfill runs orphaned by an app restart. Each run
 * dir under .antigravity/tmux carries a meta.json {taskId,projectId,bridgeId,agent};
 * the dir only survives if the process died before finalize. For each still-pending
 * bridge: if the agent finished (exit file) apply its reply; if its tmux session is
 * still alive, resume polling; otherwise mark it interrupted. Stale/superseded runs
 * are dropped.
 */
export function recoverTmuxBridges(): void {
    for (const dir of listTmuxRunDirs()) {
        const meta = readTmuxMeta(dir);
        if (!meta) continue;
        const { taskId, bridgeId, agent } = meta;

        const bridge = readBridgeRequest(taskId);
        if (!bridge || bridge.id !== bridgeId || bridge.status !== "pending") {
            cleanupTmuxRun(taskId); // already handled or superseded
            continue;
        }
        const adapter = ADAPTERS[agent];
        if (!adapter || adapter.kind !== "spawn") {
            // tmux recovery only applies to spawn adapters; sdk runs recover via
            // their own session (Step 3.5), not tmux run dirs.
            writeBridgeResponse(taskId, bridgeId, { status: "error", error: `Auto-bridge agent "${agent}" is not a recoverable spawn adapter.` });
            cleanupTmuxRun(taskId);
            continue;
        }

        const onLog = (s: string) => publishTaskLog(taskId, s);
        const outcome = readTmuxOutcome(taskId);
        if (outcome.hasExit) {
            publishTaskLog(taskId, `\n[auto-bridge] recovered a completed ${adapter.bin} run after restart.\n`);
            finalizeAgentRun(taskId, bridgeId, adapter, { exitCode: outcome.exitCode, stdout: outcome.stdout, timedOut: false });
            cleanupTmuxRun(taskId);
        } else if (tmuxSessionAlive(taskId)) {
            publishTaskLog(taskId, `\n[auto-bridge] resuming a live ${adapter.bin} tmux run after restart…\n`);
            void pollTmuxRun(taskId, TIMEOUT_MS, onLog).then((result) => finalizeAgentRun(taskId, bridgeId, adapter, result));
        } else {
            writeBridgeResponse(taskId, bridgeId, { status: "error", error: "Auto-bridge interrupted by an app restart." });
            cleanupTmuxRun(taskId);
        }
    }
}
