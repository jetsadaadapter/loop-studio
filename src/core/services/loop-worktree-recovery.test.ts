import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

let projectsFixture: { id: string; path: string; tasks: LoopTask[] }[] = [];
let branchExists = false;
let isRepo = true;
let wtExists = false;
let fsEntries: string[] = [];
const removedDirs: string[] = [];
const gitCalls: string[][] = [];

vi.mock("fs", () => ({
    default: {
        existsSync: () => wtExists,
        rmSync: (p: string) => { removedDirs.push(p); },
        readdirSync: () => { if (fsEntries.length === 0) throw new Error("ENOENT"); return fsEntries; },
    },
}));

vi.mock("@/core/services/loop-projects.service", () => ({
    getProjects: () => projectsFixture,
    saveProjects: () => {},
    isOwnGitRepo: async () => isRepo,
    executeGitCommand: vi.fn(async (_cwd: string, args: string[]) => {
        gitCalls.push(args);
        if (args[0] === "rev-parse" && args.includes("--verify")) {
            if (!branchExists) throw new Error("unknown ref");
            return "sha";
        }
        return "";
    }),
}));

import { recoverTaskWorktrees, gcTaskWorktrees } from "./loop-worktree-recovery";

const worktreeDir = (id: string) => path.join(process.cwd(), ".antigravity", "worktrees", id);
const task = (over: Partial<LoopTask> = {}): LoopTask => ({
    id: "t1", projectId: "p1", name: "t1", status: "pending", currentStage: "BUILD",
    targetFiles: [], chatHistory: [], activities: [], tokensUsed: { input: 0, output: 0, cost: 0 },
    createdAt: "", updatedAt: "", ...over,
});
const setGit = () => {
    projectsFixture[0].tasks[0].git = {
        worktreeDir: worktreeDir("t1"), branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
    };
};

beforeEach(() => {
    projectsFixture = [{ id: "p1", path: "/repo", tasks: [task()] }];
    branchExists = false;
    isRepo = true;
    wtExists = false;
    fsEntries = [];
    removedDirs.length = 0;
    gitCalls.length = 0;
});

describe("recoverTaskWorktrees", () => {
    it("resumes when branch + worktree are both present", async () => {
        setGit();
        branchExists = true;
        wtExists = true;
        const r = await recoverTaskWorktrees();
        expect(r.resumed).toEqual(["t1"]);
        expect(projectsFixture[0].tasks[0].git).not.toBeNull();
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "add")).toBe(false);
    });

    it("re-adds the worktree when the branch is present but the dir is gone", async () => {
        setGit();
        branchExists = true;
        wtExists = false;
        const r = await recoverTaskWorktrees();
        expect(r.readded).toEqual(["t1"]);
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "add")).toBe(true);
    });

    it("clears git state when the branch is gone (stale)", async () => {
        setGit();
        branchExists = false;
        const r = await recoverTaskWorktrees();
        expect(r.stale).toEqual(["t1"]);
        expect(projectsFixture[0].tasks[0].git).toBeNull();
    });

    it("skips tasks with no git state", async () => {
        projectsFixture[0].tasks[0].git = null;
        const r = await recoverTaskWorktrees();
        expect(r).toEqual({ resumed: [], readded: [], stale: [] });
    });
});

describe("gcTaskWorktrees", () => {
    it("removes an orphaned dir no task references", async () => {
        fsEntries = ["ghost"];
        const r = await gcTaskWorktrees();
        expect(r.removed).toEqual(["ghost"]);
        expect(removedDirs).toContain(worktreeDir("ghost"));
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "prune")).toBe(true);
    });

    it("keeps a dir still referenced by a task's git state", async () => {
        setGit();
        fsEntries = ["t1"];
        const r = await gcTaskWorktrees();
        expect(r.kept).toEqual(["t1"]);
        expect(r.removed).toEqual([]);
        expect(removedDirs).toEqual([]);
    });

    it("no-ops when the worktrees root does not exist", async () => {
        fsEntries = [];
        const r = await gcTaskWorktrees();
        expect(r).toEqual({ removed: [], kept: [] });
    });
});
