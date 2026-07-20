import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ResolvedLlm } from "@/core/services/loop-collaboration.helpers";

// Hoisted spies so vi.mock factories can reference them.
const {
    getProjectsMock,
    runProjectCommandMock,
    resolveTaskCwdMock,
    runAgentSdkMock,
    appendHistoryMock,
    updateStatusMock,
    getAgentsMock,
} = vi.hoisted(() => ({
    getProjectsMock: vi.fn(),
    runProjectCommandMock: vi.fn(),
    resolveTaskCwdMock: vi.fn(),
    runAgentSdkMock: vi.fn(),
    appendHistoryMock: vi.fn(),
    updateStatusMock: vi.fn(),
    getAgentsMock: vi.fn(),
}));

vi.mock("fs", () => ({ default: { appendFileSync: () => {} } }));

vi.mock("@/core/services/loop-projects.service", () => ({
    getProjects: getProjectsMock,
    applyFileEdits: vi.fn(),
    runProjectCommand: runProjectCommandMock,
    getGitInfo: vi.fn(),
}));

vi.mock("@/core/services/loop-worktree.service", () => ({
    resolveTaskCwd: resolveTaskCwdMock,
    checkpoint: vi.fn(),
}));

vi.mock("@/core/services/loop-agents.service", () => ({ getAgents: getAgentsMock }));
vi.mock("@/core/services/loop-knowledge.service", () => ({ knowledgeForPrompt: () => "" }));

// Only appendHistoryMessage/updateTaskStatus are exercised by the delegation
// branch; the rest are stubbed so the module's named imports still resolve.
vi.mock("@/core/services/loop-collaboration.helpers", () => ({
    callAgentLLM: vi.fn(),
    logBlockedEdits: vi.fn(),
    executeGitDiff: vi.fn(),
    appendHistoryMessage: appendHistoryMock,
    updateTaskStatus: updateStatusMock,
    MAX_FIX_ATTEMPTS: 2,
    MAX_TEST_OUTPUT_CHARS: 4000,
}));

// The delegation branch dynamically imports "./loop-sdk-runner".
vi.mock("./loop-sdk-runner", () => ({ runAgentSdk: runAgentSdkMock }));

import { runCollaborationLoop } from "./loop-collaboration.service";

const llm: ResolvedLlm = { provider: "anthropic", apiKey: "k", model: "claude" };
const REPO = "/repo";

function seedSdkProject(worktreeDir = "/wt") {
    getProjectsMock.mockReturnValue([
        {
            id: "p1",
            autoAgent: "claude-sdk",
            tasks: [{ id: "t1", targetFiles: [], git: { worktreeDir } }],
        },
    ]);
}

beforeEach(() => {
    vi.clearAllMocks();
    resolveTaskCwdMock.mockResolvedValue("/wt");
    runAgentSdkMock.mockResolvedValue({ summary: "did the thing", editedFiles: ["src/a.ts"] });
    runProjectCommandMock.mockResolvedValue(0);
});

describe("runCollaborationLoop — Agent SDK delegation branch", () => {
    it("delegates to runAgentSdk when the project's autoAgent is claude-sdk", async () => {
        seedSdkProject();
        const r = await runCollaborationLoop("p1", "t1", REPO, llm, "add /health");

        expect(runAgentSdkMock).toHaveBeenCalledWith({
            taskId: "t1",
            projectId: "p1",
            prompt: "add /health",
            onLog: expect.any(Function),
        });
        expect(r).toEqual({ success: true, testsPassed: true, typecheckPassed: true });
    });

    it("typechecks against the task worktree dir and records the agent's summary", async () => {
        seedSdkProject("/wt");
        await runCollaborationLoop("p1", "t1", REPO, llm, "x");

        expect(runProjectCommandMock).toHaveBeenCalledWith(
            "t1-ci",
            "/wt",
            "npx",
            ["tsc", "--noEmit"],
            expect.any(Function),
        );
        expect(appendHistoryMock).toHaveBeenCalledWith("p1", "t1", "Somsri (Agent SDK)", "did the thing", 0, 0, 0);
        expect(updateStatusMock).toHaveBeenCalledWith("p1", "t1", "completed", "OBSERVE");
    });

    it("falls back to projectPath for the typecheck cwd when no worktree dir is recorded", async () => {
        getProjectsMock.mockReturnValue([
            { id: "p1", autoAgent: "claude-sdk", tasks: [{ id: "t1", targetFiles: [] }] },
        ]);
        await runCollaborationLoop("p1", "t1", REPO, llm, "x");
        expect(runProjectCommandMock).toHaveBeenCalledWith("t1-ci", REPO, "npx", ["tsc", "--noEmit"], expect.any(Function));
    });

    it("reports typecheck failure but still succeeds when tsc exits non-zero", async () => {
        seedSdkProject();
        runProjectCommandMock.mockResolvedValue(1);
        const r = await runCollaborationLoop("p1", "t1", REPO, llm, "x");
        expect(r).toEqual({ success: true, testsPassed: false, typecheckPassed: false });
    });

    it("does NOT delegate when autoAgent is not claude-sdk", async () => {
        getProjectsMock.mockReturnValue([
            { id: "p1", autoAgent: "claude", tasks: [{ id: "t1", targetFiles: [] }] },
        ]);
        getAgentsMock.mockReturnValue([]); // forces the non-delegation pipeline to bail early
        const r = await runCollaborationLoop("p1", "t1", REPO, llm, "x");

        expect(runAgentSdkMock).not.toHaveBeenCalled();
        expect(r.success).toBe(false);
        expect(r.error).toMatch(/core AI team agents/);
    });
});
