import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import { selectBacklogTasks, getAutoRunStatus, deleteAutoRunState, type AutoRunState } from "./loop-autorun.service";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

// In-memory json-store + project store so persistence/recovery logic can be
// exercised without touching the real .antigravity/.
const stores = new Map<string, unknown>();
vi.mock("./json-store", () => ({
    assertSafeStoreId: (id: string) => {
        if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`Invalid store id: ${id}`);
        return id;
    },
    readJsonStore: (filePath: string, defaultValue: unknown) =>
        stores.has(filePath) ? stores.get(filePath) : defaultValue,
    writeJsonStore: (filePath: string, data: unknown) => {
        stores.set(filePath, data);
    },
    deleteJsonStore: (filePath: string) => {
        stores.delete(filePath);
    },
}));

let projectsFixture: { id: string; tasks: LoopTask[] }[] = [];
vi.mock("@/core/services/loop-projects.service", () => ({
    getProjects: () => projectsFixture,
    saveProjects: () => {},
    executeGitCommand: vi.fn(),
    isHostProject: () => false,
    isOwnGitRepo: async () => true,
}));
vi.mock("@/core/services/loop-collaboration.service", () => ({ runCollaborationLoop: vi.fn() }));
vi.mock("@/core/services/loop-knowledge.service", () => ({ upsertKnowledgeEntry: vi.fn() }));

const task = (id: string, overrides: Partial<LoopTask> = {}): LoopTask => ({
    id,
    projectId: "p1",
    name: id,
    status: "pending",
    currentStage: "PLAN",
    targetFiles: ["a.ts"],
    kanbanColumn: "backlog",
    chatHistory: [],
    activities: [],
    tokensUsed: { input: 0, output: 0, cost: 0 },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
});

describe("selectBacklogTasks", () => {
    it("selects only pending backlog tasks", () => {
        const picked = selectBacklogTasks([
            task("a"),
            task("b", { kanbanColumn: "done" }),
            task("c", { status: "completed" }),
            task("d", { kanbanColumn: undefined }),
        ]);
        expect(picked.map((t) => t.id)).toEqual(["a"]);
    });

    it("keeps group members adjacent, groups in first-seen order", () => {
        const picked = selectBacklogTasks([
            task("a1", { sprintId: "g1" }),
            task("b1", { sprintId: "g2" }),
            task("a2", { sprintId: "g1" }),
        ]);
        expect(picked.map((t) => t.id)).toEqual(["a1", "a2", "b1"]);
    });

    it("filters by explicit taskIds when given", () => {
        const picked = selectBacklogTasks([task("a"), task("b")], ["b"]);
        expect(picked.map((t) => t.id)).toEqual(["b"]);
    });
});

describe("auto-run state persistence", () => {
    // Use a per-test project id: the service keeps a module-level RUNS map we
    // can't reset, and deleteAutoRunState covers the cross-test cleanup path.
    const stateFile = (projectId: string) =>
        path.join(process.cwd(), ".antigravity", `autorun-${projectId}.json`);

    const persistedRun = (overrides: Partial<AutoRunState> = {}): AutoRunState => ({
        running: false,
        startedAt: "2026-01-01T00:00:00Z",
        finishedAt: "2026-01-01T01:00:00Z",
        total: 1,
        results: [{ taskId: "t1", name: "t1", outcome: "done", detail: "Auto-closed." }],
        stopRequested: false,
        ...overrides,
    });

    beforeEach(() => {
        stores.clear();
        projectsFixture = [];
    });

    it("returns null when no run was ever recorded", () => {
        expect(getAutoRunStatus("p-none")).toBeNull();
    });

    it("returns a finished run from disk after a restart", () => {
        stores.set(stateFile("p-hist"), persistedRun());
        const state = getAutoRunStatus("p-hist");
        expect(state?.running).toBe(false);
        expect(state?.results).toHaveLength(1);
        expect(state?.interrupted).toBeUndefined();
    });

    it("marks a run that died mid-flight as interrupted and returns its task to the backlog", () => {
        const t = task("t1", { status: "running", kanbanColumn: "in_progress" });
        projectsFixture = [{ id: "p-dead", tasks: [t] }];
        stores.set(
            stateFile("p-dead"),
            persistedRun({ running: true, finishedAt: undefined, results: [], currentTaskId: "t1", currentTaskName: "t1" })
        );

        const state = getAutoRunStatus("p-dead")!;
        expect(state.running).toBe(false);
        expect(state.interrupted).toBe(true);
        expect(state.currentTaskId).toBeUndefined();
        expect(state.results[0].outcome).toBe("failed");
        expect(state.results[0].detail).toContain("restart");
        expect(t.status).toBe("pending");
        expect(t.kanbanColumn).toBe("backlog");
        // Recovery is persisted, so the next read doesn't re-run it.
        expect((stores.get(stateFile("p-dead")) as AutoRunState).interrupted).toBe(true);
    });

    it("deleteAutoRunState clears the persisted state", () => {
        stores.set(stateFile("p-del"), persistedRun());
        deleteAutoRunState("p-del");
        expect(getAutoRunStatus("p-del")).toBeNull();
    });
});
