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
    callAgentLLMMock,
    applyFileEditsMock,
    writeBridgeRequestMock,
    autoFulfillBridgeMock,
} = vi.hoisted(() => ({
    getProjectsMock: vi.fn(),
    runProjectCommandMock: vi.fn(),
    resolveTaskCwdMock: vi.fn(),
    runAgentSdkMock: vi.fn(),
    appendHistoryMock: vi.fn(),
    updateStatusMock: vi.fn(),
    getAgentsMock: vi.fn(),
    callAgentLLMMock: vi.fn(),
    applyFileEditsMock: vi.fn(),
    writeBridgeRequestMock: vi.fn(),
    autoFulfillBridgeMock: vi.fn(),
}));

vi.mock("fs", () => ({ default: { appendFileSync: () => {} } }));

vi.mock("@/core/services/loop-projects.service", () => ({
    getProjects: getProjectsMock,
    applyFileEdits: applyFileEditsMock,
    runProjectCommand: runProjectCommandMock,
    getGitInfo: () => ({ branch: "main", commit: "abc1234", modifiedFiles: [] }),
    writeBridgeRequest: writeBridgeRequestMock,
}));

// isLlmCapacityError is the REAL guard (pure marker check) — the tests throw a
// tagged error to exercise it. autoFulfillBridge is dynamically imported.
vi.mock("@/core/services/loop-bridge-worker.service", () => ({ autoFulfillBridge: autoFulfillBridgeMock }));

vi.mock("@/core/services/loop-worktree.service", () => ({
    resolveTaskCwd: resolveTaskCwdMock,
    checkpoint: vi.fn(),
}));

vi.mock("@/core/services/loop-agents.service", () => ({ getAgents: getAgentsMock }));
vi.mock("@/core/services/loop-knowledge.service", () => ({ knowledgeForPrompt: () => "" }));

// Only appendHistoryMessage/updateTaskStatus are exercised by the delegation
// branch; the rest are stubbed so the module's named imports still resolve.
vi.mock("@/core/services/loop-collaboration.helpers", () => ({
    callAgentLLM: callAgentLLMMock,
    logBlockedEdits: vi.fn(),
    executeGitDiff: vi.fn().mockResolvedValue(""),
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
    callAgentLLMMock.mockResolvedValue({ text: "ok", input: 0, output: 0, cost: 0 });
    applyFileEditsMock.mockReturnValue({ written: [], blocked: [] });
    writeBridgeRequestMock.mockReturnValue("bridge-xyz");
});

const CORE_AGENTS = [
    { id: "agent-somchai", systemPrompt: "architect" },
    { id: "agent-somsri", systemPrompt: "developer" },
    { id: "agent-wichai", systemPrompt: "qa" },
    { id: "agent-preecha", systemPrompt: "auditor" },
];

describe("runCollaborationLoop — Developer step output contract", () => {
    it("tells the Developer to reply with <file_edit> blocks scoped to the task's targetFiles", async () => {
        getProjectsMock.mockReturnValue([
            { id: "p1", tasks: [{ id: "t1", targetFiles: ["src/App.tsx"] }] },
        ]);
        getAgentsMock.mockReturnValue(CORE_AGENTS);

        await runCollaborationLoop("p1", "t1", "/repo", llm, "build the app");

        // STEP 2 (Developer) is the 2nd callAgentLLM call; its system prompt (arg 1)
        // must state the <file_edit> output contract, or the maker writes nothing.
        const devPrompt = callAgentLLMMock.mock.calls[1][1] as string;
        expect(devPrompt).toContain("<file_edit path=");
        expect(devPrompt).toContain("src/App.tsx");
    });
});

describe("runCollaborationLoop — LLM capacity handoff to the IDE bridge", () => {
    function capacityError(): Error {
        return Object.assign(new Error("API rate limit or quota exceeded."), { llmErrorKind: "capacity" });
    }

    beforeEach(() => {
        getProjectsMock.mockReturnValue([{ id: "p1", tasks: [{ id: "t1", targetFiles: ["src/App.tsx"] }] }]);
        getAgentsMock.mockReturnValue(CORE_AGENTS);
        autoFulfillBridgeMock.mockResolvedValue(undefined); // async in real code — must be awaitable/.catch-able
    });

    it("hands off to the bridge (not failed) when the LLM hits a capacity limit", async () => {
        callAgentLLMMock.mockRejectedValueOnce(capacityError());

        const r = await runCollaborationLoop("p1", "t1", "/repo", llm, "build the app");

        // A collaborate bridge request is queued and auto-fulfill kicked off.
        expect(writeBridgeRequestMock).toHaveBeenCalledWith(
            expect.objectContaining({ taskId: "t1", projectId: "p1", requestType: "collaborate", prompt: "build the app" }),
        );
        expect(autoFulfillBridgeMock).toHaveBeenCalledWith("t1", "bridge-xyz");
        // Task is "running" (bridge working), NOT "failed".
        expect(updateStatusMock).toHaveBeenCalledWith("p1", "t1", "running", "BUILD");
        expect(updateStatusMock).not.toHaveBeenCalledWith("p1", "t1", "failed", "PLAN");
        expect(r.bridged).toBe(true);
        expect(r.success).toBe(false);
    });

    it("still fails for a non-capacity error (real bug), with no bridge handoff", async () => {
        callAgentLLMMock.mockRejectedValueOnce(new Error("TypeError: undefined is not a function"));

        const r = await runCollaborationLoop("p1", "t1", "/repo", llm, "build the app");

        expect(writeBridgeRequestMock).not.toHaveBeenCalled();
        expect(updateStatusMock).toHaveBeenCalledWith("p1", "t1", "failed", "PLAN");
        expect(r.bridged).toBeUndefined();
        expect(r.success).toBe(false);
    });
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
