import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

// The scheduler reads/writes projects and calls the auto-run + LLM services;
// mock all three so the tick logic (due/gating/result) is tested in isolation.
let projectsFixture: LoopProject[] = [];
vi.mock("@/core/services/loop-projects.service", () => ({
    getProjects: () => projectsFixture,
    saveProjects: (p: LoopProject[]) => { projectsFixture = p; },
}));

let hasKey = true;
vi.mock("@/core/services/loop-llm.service", () => ({
    resolveLoopLlm: () => (hasKey ? { provider: "anthropic", apiKey: "k", model: "m" } : null),
}));

const startAutoRun = vi.fn<(...args: unknown[]) => { started: boolean; total: number }>(
    () => ({ started: true, total: 2 }),
);
let running = false;
vi.mock("@/core/services/loop-autorun.service", () => ({
    startAutoRun: (...args: unknown[]) => startAutoRun(...args),
    getAutoRunStatus: () => (running ? { running: true } : null),
    selectBacklogTasks: (tasks: unknown[]) => tasks,
}));

import { schedulerTick } from "./loop-scheduler.service";

const project = (overrides: Partial<LoopProject> = {}): LoopProject => ({
    id: "p1",
    name: "P1",
    path: "/fake",
    template: "nextjs-app",
    tasks: [{ id: "t1" }] as unknown as LoopProject["tasks"],
    createdAt: "",
    updatedAt: "",
    ...overrides,
});

describe("schedulerTick", () => {
    beforeEach(() => {
        startAutoRun.mockClear();
        hasKey = true;
        running = false;
        projectsFixture = [];
    });

    it("ignores projects without an enabled schedule", () => {
        projectsFixture = [project({ schedule: { enabled: false, intervalMinutes: 60 } })];
        schedulerTick();
        expect(startAutoRun).not.toHaveBeenCalled();
    });

    it("starts an auto-run when enabled, due, and a key + backlog exist", () => {
        projectsFixture = [project({ schedule: { enabled: true, intervalMinutes: 60 } })];
        schedulerTick();
        expect(startAutoRun).toHaveBeenCalledTimes(1);
        expect(projectsFixture[0].schedule?.lastResult).toContain("started 2");
        expect(projectsFixture[0].schedule?.lastRunAt).toBeTruthy();
    });

    it("skips (and records) when no server API key is set", () => {
        hasKey = false;
        projectsFixture = [project({ schedule: { enabled: true, intervalMinutes: 60 } })];
        schedulerTick();
        expect(startAutoRun).not.toHaveBeenCalled();
        expect(projectsFixture[0].schedule?.lastResult).toContain("no server API key");
    });

    it("skips when there is no backlog", () => {
        projectsFixture = [project({ tasks: [], schedule: { enabled: true, intervalMinutes: 60 } })];
        schedulerTick();
        expect(startAutoRun).not.toHaveBeenCalled();
        expect(projectsFixture[0].schedule?.lastResult).toContain("no backlog");
    });

    it("does not start again before the interval elapses", () => {
        const justNow = new Date().toISOString();
        projectsFixture = [project({ schedule: { enabled: true, intervalMinutes: 60, lastRunAt: justNow } })];
        schedulerTick();
        expect(startAutoRun).not.toHaveBeenCalled();
    });

    it("does not start when a run is already in flight", () => {
        running = true;
        projectsFixture = [project({ schedule: { enabled: true, intervalMinutes: 60 } })];
        schedulerTick();
        expect(startAutoRun).not.toHaveBeenCalled();
    });
});
