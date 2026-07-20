import { writeGuardedFile, runProjectCommand } from "@/core/services/loop-projects.service";
import { checkpoint } from "@/core/services/loop-worktree.service";

// Handler logic for the Agent SDK's guarded tools (see
// docs/guarded-tools-pretooluse.md). Kept as plain functions so they are unit-
// testable WITHOUT the SDK; the SDK adapter (step 3) wraps them with tool() +
// createSdkMcpServer(). Every mutation still passes through the shared guard
// (writeGuardedFile → evaluateEdit) so config/test/scope rules always hold.

export interface AgentToolContext {
    taskId: string;
    /** The dir the agent works in — the task worktree, or the repo path (legacy). */
    cwd: string;
    /** The task's declared scope; empty = no restriction. */
    targetFiles: string[];
    /** Whether this agent role may author test files (QA). */
    allowTestFiles?: boolean;
}

/**
 * `edit_file` tool: write one file through the guard, then checkpoint it. A denied
 * edit returns { ok: false, reason } so the agent sees WHY and can re-plan; it is
 * never written.
 */
export async function editFile(
    ctx: AgentToolContext,
    input: { path: string; content: string },
): Promise<{ ok: boolean; path?: string; reason?: string }> {
    const result = writeGuardedFile(ctx.cwd, input.path, input.content, {
        allowTestFiles: ctx.allowTestFiles,
        allowedPaths: ctx.targetFiles,
    });
    if (result.blocked) return { ok: false, reason: result.blocked.reason };

    // Commit a rollback point; a checkpoint failure must not fail the edit.
    await checkpoint(ctx.taskId, { stage: "BUILD", label: `edit_file: ${result.written}` }).catch(() => {});
    return { ok: true, path: result.written };
}

export type VerificationKind = "vitest" | "tsc" | "build";

// The command each verification maps to (run in the agent's cwd).
function verifyCommand(kind: VerificationKind, target?: string): [string, string[]] | null {
    if (kind === "vitest") return ["npx", ["vitest", "run", ...(target ? [target] : [])]];
    if (kind === "tsc") return ["npx", ["tsc", "--noEmit"]];
    if (kind === "build") return ["npm", ["run", "build"]];
    return null;
}

const MAX_OUTPUT_CHARS = 4000;

/**
 * `run_verification` tool: run tests / typecheck / build in the agent's cwd and
 * return the pass/fail + output tail. This is what lets the agent see a failure
 * and fix itself (read-only signal — no guard needed).
 */
export async function runVerification(
    ctx: AgentToolContext,
    input: { kind: VerificationKind; target?: string },
): Promise<{ passed: boolean; output: string }> {
    const spec = verifyCommand(input.kind, input.target);
    if (!spec) return { passed: false, output: `Unknown verification kind: ${input.kind}` };

    let output = "";
    const code = await runProjectCommand(ctx.taskId, ctx.cwd, spec[0], spec[1], (chunk) => {
        output = (output + chunk).slice(-MAX_OUTPUT_CHARS);
    });
    return { passed: code === 0, output: output.trim() };
}
