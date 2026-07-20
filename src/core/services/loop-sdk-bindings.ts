import { tool, createSdkMcpServer, type HookInput } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { editFile, runVerification, type AgentToolContext } from "./loop-agent-tools";
import { evaluateToolCall, type ToolGuardContext } from "./loop-pretooluse-guard";

// Thin SDK bindings for Step 3.3 (see docs/sdk-adapter-wiring.md): expose the
// guarded tool handlers as an in-process MCP server, and map the pure PreToolUse
// decision onto the SDK hook. All the logic lives in loop-agent-tools /
// loop-pretooluse-guard (unit-tested there); this file is just glue.

/** An in-process MCP server exposing the guarded edit_file + run_verification
 *  tools, bound to one task's context. Registered on query()'s mcpServers. */
export function createLoopToolServer(ctx: AgentToolContext) {
    return createSdkMcpServer({
        name: "loop",
        version: "1.0.0",
        tools: [
            tool(
                "edit_file",
                "Write a file inside the task's scope. Guarded (config/test/scope) and checkpointed.",
                { path: z.string(), content: z.string() },
                async (args) => {
                    const r = await editFile(ctx, { path: args.path, content: args.content });
                    return {
                        content: [{ type: "text" as const, text: r.ok ? `wrote ${r.path}` : `refused: ${r.reason}` }],
                        isError: !r.ok,
                    };
                },
            ),
            tool(
                "run_verification",
                "Run tests / typecheck / build in the task worktree and return the result.",
                { kind: z.enum(["vitest", "tsc", "build"]), target: z.string().optional() },
                async (args) => {
                    const r = await runVerification(ctx, { kind: args.kind, target: args.target });
                    return {
                        content: [{ type: "text" as const, text: `${r.passed ? "PASS" : "FAIL"}\n${r.output}` }],
                        isError: !r.passed,
                    };
                },
            ),
        ],
    });
}

/**
 * Map our pure guard decision onto the SDK PreToolUse hook. This is the choke
 * point the SDK actually consults (canUseTool is shadowed). `ask` fails CLOSED
 * (deny) when headless — auto-fulfill has no operator to review the request.
 */
export function createPreToolUseHook(ctx: ToolGuardContext, opts: { headless?: boolean } = {}) {
    // Typed as the broad HookInput union (what HookCallback requires); at runtime
    // the SDK only invokes this for PreToolUse, which carries tool_name/tool_input.
    return async (input: HookInput) => {
        const toolName = (input as { tool_name?: string }).tool_name ?? "";
        const toolInput = (input as { tool_input?: unknown }).tool_input ?? {};
        const decision = evaluateToolCall(toolName, toolInput as Record<string, unknown>, ctx);
        const permissionDecision =
            decision.decision === "ask" && opts.headless ? "deny" : decision.decision;
        return {
            hookSpecificOutput: {
                hookEventName: "PreToolUse" as const,
                permissionDecision,
                permissionDecisionReason: decision.reason,
            },
        };
    };
}
