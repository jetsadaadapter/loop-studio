import { evaluateEdit } from "@/core/services/loop-projects.service";
import type { RiskTier } from "@/core/interfaces/loop-projects.interface";

// The PreToolUse choke point (see docs/guarded-tools-pretooluse.md). A pure
// decision over one tool call — the Agent SDK adapter (step 3) maps the result to
// the hook's { permissionDecision } shape. Verified fact: the PreToolUse hook, not
// canUseTool, is the real choke point (canUseTool is shadowed by auto-approvals),
// and it runs BEFORE every other permission check. Kept SDK-free so it's unit-
// testable on synthetic tool inputs.

export interface ToolGuardContext {
    /** The task's declared scope; empty = no restriction. */
    targetFiles: string[];
    /** Whether this agent role may author test files (QA). */
    allowTestFiles?: boolean;
    /** The task's risk tier — RED/ORANGE route mutations to human review. */
    riskTier?: RiskTier;
    /** Bare command names run_command may invoke, e.g. ["git", "npx", "npm"]. */
    commandAllowlist?: string[];
}

export interface ToolGuardDecision {
    decision: "allow" | "deny" | "ask";
    /** Present for deny/ask so the agent (or operator) sees why. */
    reason?: string;
}

// Read-only tools + verification never mutate — always allowed (they're confined
// to the agent's cwd by the SDK options, not here).
const READ_ONLY_TOOLS = new Set(["Read", "Grep", "Glob", "mcp__loop__run_verification"]);
const HIGH_RISK: ReadonlySet<RiskTier> = new Set<RiskTier>(["RED", "ORANGE"]);

/**
 * Decide whether one tool call may proceed. `ask` means route to human review;
 * the adapter fails `ask` closed (deny) when running headless. Every mutating path
 * flows through here, and file edits reuse `evaluateEdit` so this can never drift
 * from the on-disk guard.
 */
export function evaluateToolCall(
    toolName: string,
    input: Record<string, unknown>,
    ctx: ToolGuardContext,
): ToolGuardDecision {
    if (READ_ONLY_TOOLS.has(toolName)) return { decision: "allow" };

    const highRisk = !!ctx.riskTier && HIGH_RISK.has(ctx.riskTier);

    if (toolName === "mcp__loop__edit_file") {
        const path = typeof input.path === "string" ? input.path : "";
        if (!path) return { decision: "deny", reason: "edit_file requires a 'path'" };
        const verdict = evaluateEdit(path, { allowTestFiles: ctx.allowTestFiles, allowedPaths: ctx.targetFiles });
        if (verdict.decision === "deny") return { decision: "deny", reason: verdict.reason };
        return highRisk
            ? { decision: "ask", reason: `high-risk tier (${ctx.riskTier}) — review edit to ${path}` }
            : { decision: "allow" };
    }

    if (toolName === "mcp__loop__run_command") {
        const cmd = typeof input.cmd === "string" ? input.cmd : "";
        const allowed = ctx.commandAllowlist ?? [];
        if (!cmd || !allowed.includes(cmd)) {
            return { decision: "deny", reason: `command not allowlisted: ${cmd || "(none)"}` };
        }
        return highRisk
            ? { decision: "ask", reason: `high-risk tier (${ctx.riskTier}) — review command "${cmd}"` }
            : { decision: "allow" };
    }

    // Built-in Write/Bash/Edit and anything else: default-deny. These are also
    // removed via disallowedTools, so this is the belt-and-suspenders backstop.
    return { decision: "deny", reason: `tool not permitted: ${toolName}` };
}
