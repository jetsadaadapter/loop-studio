import { describe, it, expect, vi, beforeEach } from "vitest";

const { queryMock, ensureMock, gitMock, getProjectsMock } = vi.hoisted(() => ({
    queryMock: vi.fn(),
    ensureMock: vi.fn(),
    gitMock: vi.fn(),
    getProjectsMock: vi.fn(),
}));

vi.mock("@anthropic-ai/claude-agent-sdk", () => ({ query: queryMock }));
vi.mock("./loop-sdk-bindings", () => ({
    createLoopToolServer: () => ({ name: "loop" }),
    createPreToolUseHook: () => async () => ({}),
}));
vi.mock("./loop-worktree.service", () => ({ ensureTaskWorktree: ensureMock }));
vi.mock("./loop-projects.service", () => ({ getProjects: getProjectsMock, executeGitCommand: gitMock }));

import { runAgentSdk } from "./loop-sdk-runner";

async function* gen(msgs: unknown[]) {
    for (const m of msgs) yield m;
}
let capturedOptions: Record<string, unknown> = {};

beforeEach(() => {
    getProjectsMock.mockReturnValue([{ id: "p1", tasks: [{ id: "t1", targetFiles: ["server.js"], riskTier: "GREEN" }] }]);
    ensureMock.mockResolvedValue({ worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "base9" });
    gitMock.mockResolvedValue("server.js\nsrc/a.ts");
    queryMock.mockReset();
    queryMock.mockImplementation((arg: { options: Record<string, unknown> }) => {
        capturedOptions = arg.options;
        return gen([
            { type: "assistant", message: { content: [{ type: "text", text: "working on it" }] } },
            { type: "result", subtype: "success", result: "added /health endpoint", total_cost_usd: 0.12, num_turns: 4 },
        ]);
    });
});

describe("runAgentSdk", () => {
    it("runs in the worktree with the guarded options and returns summary + diffed files", async () => {
        const logs: string[] = [];
        const r = await runAgentSdk({ taskId: "t1", projectId: "p1", prompt: "add /health", onLog: (s) => logs.push(s) });

        expect(r.summary).toBe("added /health endpoint");
        expect(r.editedFiles).toEqual(["server.js", "src/a.ts"]);

        // options are assembled from the worktree + guards
        expect(capturedOptions.cwd).toBe("/wt");
        expect(capturedOptions.disallowedTools).toEqual(["Write", "Bash", "Edit"]);
        expect(capturedOptions.allowedTools).toContain("mcp__loop__edit_file");
        expect(capturedOptions.mcpServers).toHaveProperty("loop");
        expect(capturedOptions.hooks).toHaveProperty("PreToolUse");
        expect(typeof capturedOptions.maxTurns).toBe("number");
        expect(typeof capturedOptions.maxBudgetUsd).toBe("number");

        // authoritative changed files come from a git diff against the branch base
        expect(gitMock).toHaveBeenCalledWith("/wt", ["diff", "--name-only", "base9"]);
    });

    it("reports a non-success result subtype in the summary", async () => {
        queryMock.mockImplementation((arg: { options: Record<string, unknown> }) => {
            capturedOptions = arg.options;
            return gen([{ type: "result", subtype: "error_max_turns", num_turns: 30, total_cost_usd: 1 }]);
        });
        const r = await runAgentSdk({ taskId: "t1", projectId: "p1", prompt: "x", onLog: () => {} });
        expect(r.summary).toContain("error_max_turns");
    });

    it("throws when the task is not found", async () => {
        getProjectsMock.mockReturnValue([]);
        await expect(runAgentSdk({ taskId: "t1", projectId: "p1", prompt: "x", onLog: () => {} })).rejects.toThrow(/Task not found/);
    });

    it("forces a worktree (ensureTaskWorktree) before running", async () => {
        await runAgentSdk({ taskId: "t1", projectId: "p1", prompt: "x", onLog: () => {} });
        expect(ensureMock).toHaveBeenCalledWith("t1");
    });
});
