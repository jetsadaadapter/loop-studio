import { describe, it, expect } from "vitest";
import { selectBacklogTasks } from "./loop-autorun.service";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

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
