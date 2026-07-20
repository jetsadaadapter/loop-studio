import { query } from "@anthropic-ai/claude-agent-sdk";
import { createLoopToolServer, createPreToolUseHook } from "./loop-sdk-bindings";
import { ensureTaskWorktree } from "./loop-worktree.service";
import { getProjects, executeGitCommand } from "./loop-projects.service";
import type { SdkRunResult } from "./loop-bridge-worker.service";

// Step 3.4: the agentic loop. Runs the Agent SDK `query()` inside the task's
// worktree with the guarded tools + PreToolUse hook, streams events to the task
// log, and returns a summary + the files it changed (edits were applied +
// checkpointed by the tools during the loop). See docs/sdk-adapter-wiring.md.

const MAX_TURNS = Number(process.env.LOOP_SDK_MAX_TURNS) || 30;
const MAX_BUDGET_USD = Number(process.env.LOOP_SDK_MAX_BUDGET_USD) || 5;

/** Extract the concatenated text of an assistant message's content blocks. */
function assistantText(message: unknown): string {
    const content = (message as { content?: Array<{ type?: string; text?: string }> })?.content ?? [];
    return content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
}

export async function runAgentSdk(args: {
    taskId: string;
    projectId: string;
    prompt: string;
    onLog: (s: string) => void;
}): Promise<SdkRunResult> {
    const { taskId, projectId, prompt, onLog } = args;

    const task = getProjects().find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    // Autonomous edits MUST be isolated — force a worktree (throws on a non-git
    // target, which runSdkAdapter turns into an error bridge reply).
    const git = await ensureTaskWorktree(taskId);
    const cwd = git.worktreeDir;
    const targetFiles = task.targetFiles ?? [];

    // One agent both implements and tests here, so allow test files; config stays
    // locked and edits stay confined to targetFiles (evaluateEdit enforces both).
    const toolServer = createLoopToolServer({ taskId, cwd, targetFiles, allowTestFiles: true });
    const preToolUse = createPreToolUseHook(
        { targetFiles, allowTestFiles: true, riskTier: task.riskTier, commandAllowlist: [] },
        { headless: true },
    );

    onLog(`\n[sdk] agentic run in ${git.branch} (max ${MAX_TURNS} turns, budget $${MAX_BUDGET_USD})\n`);

    let summary = "";
    const stream = query({
        prompt,
        options: {
            cwd,
            model: "opus",
            mcpServers: { loop: toolServer },
            allowedTools: ["Read", "Grep", "Glob", "mcp__loop__edit_file", "mcp__loop__run_verification"],
            disallowedTools: ["Write", "Bash", "Edit"],
            hooks: { PreToolUse: [{ hooks: [preToolUse] }] },
            maxTurns: MAX_TURNS,
            maxBudgetUsd: MAX_BUDGET_USD,
            abortController: new AbortController(),
        },
    });

    for await (const m of stream) {
        if (m.type === "assistant") {
            const text = assistantText((m as { message?: unknown }).message);
            if (text) onLog(`[sdk] ${text.slice(0, 800)}\n`);
        } else if (m.type === "result") {
            const cost = (m as { total_cost_usd?: number }).total_cost_usd ?? 0;
            const turns = (m as { num_turns?: number }).num_turns ?? 0;
            onLog(`[sdk] finished — ${turns} turns, $${cost.toFixed(4)}\n`);
            summary = m.subtype === "success" ? m.result : `SDK run ended: ${m.subtype}`;
        }
    }

    // Authoritative changed-file list: diff the task branch against its base.
    const diff = await executeGitCommand(cwd, ["diff", "--name-only", git.baseSha]).catch(() => "");
    const editedFiles = diff.split("\n").map((s) => s.trim()).filter(Boolean);

    return { summary: summary || "(no summary)", editedFiles };
}
