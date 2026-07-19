import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

// Mutable state driving the mocked git primitive + store.
let projectsFixture: { id: string; path: string; useWorktree?: boolean; tasks: LoopTask[] }[] = [];
let branchExists = false;
let dirty = "";
let isRepo = true;
let optIn = false;
let wtExists = false;
let fsEntries: string[] = [];
const removedDirs: string[] = [];
const gitCalls: string[][] = [];

vi.mock("fs", () => ({
    default: {
        existsSync: () => wtExists,
        mkdirSync: () => {},
        readdirSync: () => {
            if (fsEntries.length === 0) throw new Error("ENOENT");
            return fsEntries;
        },
        rmSync: (p: string) => { removedDirs.push(p); },
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
            return "branchsha";
        }
        if (args[0] === "rev-parse" && args[args.length - 1] === "HEAD") return "headsha";
        if (args[0] === "rev-parse") return "basesha";
        if (args[0] === "status") return dirty;
        if (args[0] === "commit") return "";
        return "";
    }),
}));

const task = (overrides: Partial<LoopTask> = {}): LoopTask => ({
    id: "t1",
    projectId: "p1",
    name: "t1",
    status: "pending",
    currentStage: "BUILD",
    targetFiles: [],
    chatHistory: [],
    activities: [],
    tokensUsed: { input: 0, output: 0, cost: 0 },
    createdAt: "",
    updatedAt: "",
    ...overrides,
});

async function svc() {
    return await import("./loop-worktree.service");
}

// Give task t1 a git state (rollback tests override checkpoints).
const setGit = (overrides: Partial<NonNullable<LoopTask["git"]>> = {}) => {
    projectsFixture[0].tasks[0].git = {
        worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
        ...overrides,
    };
};

beforeEach(() => {
    optIn = false;
    projectsFixture = [{ id: "p1", path: "/repo", useWorktree: optIn, tasks: [task()] }];
    branchExists = false;
    dirty = "";
    isRepo = true;
    wtExists = false;
    fsEntries = [];
    removedDirs.length = 0;
    gitCalls.length = 0;
});

describe("loop-worktree naming", () => {
    it("derives a stable branch + worktree dir from the task id", async () => {
        const { taskBranchName, taskWorktreeDir } = await svc();
        expect(taskBranchName("t1")).toBe("loop/task-t1");
        expect(taskWorktreeDir("t1")).toBe(
            path.join(process.cwd(), ".antigravity", "worktrees", "t1"),
        );
    });
});

describe("resolveTaskCwd", () => {
    it("returns the repo path when the project has not opted in", async () => {
        projectsFixture[0].useWorktree = false;
        const { resolveTaskCwd } = await svc();
        expect(await resolveTaskCwd("t1")).toBe("/repo");
        expect(gitCalls.length).toBe(0); // no worktree created
    });

    it("returns the worktree dir when the project opted in", async () => {
        projectsFixture[0].useWorktree = true;
        const { resolveTaskCwd, taskWorktreeDir } = await svc();
        expect(await resolveTaskCwd("t1")).toBe(taskWorktreeDir("t1"));
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "add")).toBe(true);
    });

    it("falls back to the repo path when the target is not a git repo", async () => {
        projectsFixture[0].useWorktree = true;
        isRepo = false;
        const { resolveTaskCwd } = await svc();
        expect(await resolveTaskCwd("t1")).toBe("/repo");
    });
});

describe("ensureTaskWorktree", () => {
    it("creates a new branch off HEAD and records git state", async () => {
        const { ensureTaskWorktree } = await svc();
        const git = await ensureTaskWorktree("t1");
        expect(git.branch).toBe("loop/task-t1");
        expect(git.baseSha).toBe("headsha"); // base resolves via `rev-parse HEAD`
        expect(git.checkpoints).toEqual([]);
        // used `worktree add -b` because the branch did not exist
        expect(gitCalls.some((a) => a[0] === "worktree" && a.includes("-b"))).toBe(true);
        expect(projectsFixture[0].tasks[0].git?.branch).toBe("loop/task-t1");
    });

    it("reuses an existing branch (no -b)", async () => {
        branchExists = true;
        const { ensureTaskWorktree } = await svc();
        await ensureTaskWorktree("t1");
        const addCall = gitCalls.find((a) => a[0] === "worktree" && a[1] === "add")!;
        expect(addCall).toBeDefined();
        expect(addCall.includes("-b")).toBe(false);
    });

    it("throws when the target is not a git repo root", async () => {
        isRepo = false;
        const { ensureTaskWorktree } = await svc();
        await expect(ensureTaskWorktree("t1")).rejects.toThrow(/not a git repo/);
    });
});

describe("checkpoint", () => {
    it("commits when dirty and appends a checkpoint", async () => {
        setGit();
        dirty = " M server.js";
        const { checkpoint } = await svc();
        const cp = await checkpoint("t1", { stage: "BUILD", label: "add health endpoint" });
        expect(cp?.sha).toBe("headsha");
        expect(cp?.label).toBe("add health endpoint");
        expect(gitCalls.some((a) => a[0] === "commit")).toBe(true);
        expect(projectsFixture[0].tasks[0].git?.checkpoints).toHaveLength(1);
    });

    it("returns null (no commit) when the worktree is clean", async () => {
        setGit();
        dirty = "";
        const { checkpoint } = await svc();
        const cp = await checkpoint("t1", { stage: "BUILD", label: "noop" });
        expect(cp).toBeNull();
        expect(gitCalls.some((a) => a[0] === "commit")).toBe(false);
    });
});

describe("rollbackTo", () => {
    it("resets to a checkpoint and drops later ones", async () => {
        setGit({ checkpoints: [
            { sha: "a", label: "1", stage: "BUILD", createdAt: "" },
            { sha: "b2", label: "2", stage: "BUILD", createdAt: "" },
            { sha: "c", label: "3", stage: "BUILD", createdAt: "" },
        ] });
        const { rollbackTo } = await svc();
        await rollbackTo("t1", "b2");
        expect(gitCalls.some((a) => a[0] === "reset" && a.includes("b2"))).toBe(true);
        expect(projectsFixture[0].tasks[0].git?.checkpoints.map((c) => c.sha)).toEqual(["a", "b2"]);
    });

    it("throws on an unknown checkpoint", async () => {
        setGit();
        const { rollbackTo } = await svc();
        await expect(rollbackTo("t1", "nope")).rejects.toThrow(/Unknown checkpoint/);
    });
});

describe("recoverTaskWorktrees", () => {
    it("resumes when branch + worktree are both present", async () => {
        setGit();
        branchExists = true;
        wtExists = true;
        const { recoverTaskWorktrees } = await svc();
        const r = await recoverTaskWorktrees();
        expect(r.resumed).toEqual(["t1"]);
        expect(projectsFixture[0].tasks[0].git).not.toBeNull();
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "add")).toBe(false);
    });

    it("re-adds the worktree when the branch is present but the dir is gone", async () => {
        setGit();
        branchExists = true;
        wtExists = false;
        const { recoverTaskWorktrees } = await svc();
        const r = await recoverTaskWorktrees();
        expect(r.readded).toEqual(["t1"]);
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "add")).toBe(true);
        expect(projectsFixture[0].tasks[0].git).not.toBeNull();
    });

    it("clears git state when the branch is gone (stale)", async () => {
        setGit();
        branchExists = false;
        const { recoverTaskWorktrees } = await svc();
        const r = await recoverTaskWorktrees();
        expect(r.stale).toEqual(["t1"]);
        expect(projectsFixture[0].tasks[0].git).toBeNull();
    });

    it("skips tasks with no git state", async () => {
        projectsFixture[0].tasks[0].git = null;
        const { recoverTaskWorktrees } = await svc();
        const r = await recoverTaskWorktrees();
        expect(r).toEqual({ resumed: [], readded: [], stale: [] });
    });
});

describe("gcTaskWorktrees", () => {
    it("removes an orphaned dir no task references", async () => {
        const { gcTaskWorktrees, taskWorktreeDir } = await svc();
        fsEntries = ["ghost"]; // no task with id "ghost"
        const r = await gcTaskWorktrees();
        expect(r.removed).toEqual(["ghost"]);
        expect(removedDirs).toContain(taskWorktreeDir("ghost"));
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "prune")).toBe(true);
    });

    it("keeps a dir still referenced by a task's git state", async () => {
        const { gcTaskWorktrees, taskWorktreeDir } = await svc();
        projectsFixture[0].tasks[0].git = {
            worktreeDir: taskWorktreeDir("t1"), branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
        };
        fsEntries = ["t1"];
        const r = await gcTaskWorktrees();
        expect(r.kept).toEqual(["t1"]);
        expect(r.removed).toEqual([]);
        expect(removedDirs).toEqual([]);
    });

    it("no-ops when the worktrees root does not exist", async () => {
        const { gcTaskWorktrees } = await svc();
        fsEntries = []; // readdirSync throws → treated as empty
        const r = await gcTaskWorktrees();
        expect(r).toEqual({ removed: [], kept: [] });
    });
});

describe("integrateTask", () => {
    it("records a leave-branch integration referencing the task branch", async () => {
        setGit();
        const { integrateTask } = await svc();
        const r = await integrateTask("t1", "leave-branch");
        expect(r).toEqual({ mode: "leave-branch", ref: "loop/task-t1" });
        expect(projectsFixture[0].tasks[0].git?.integration).toEqual({ mode: "leave-branch", ref: "loop/task-t1" });
    });

    it("rejects not-yet-implemented modes", async () => {
        setGit();
        const { integrateTask } = await svc();
        await expect(integrateTask("t1", "open-pr")).rejects.toThrow(/not implemented/);
        await expect(integrateTask("t1", "merge")).rejects.toThrow(/not implemented/);
    });

    it("throws when the task has no worktree", async () => {
        projectsFixture[0].tasks[0].git = null;
        const { integrateTask } = await svc();
        await expect(integrateTask("t1", "leave-branch")).rejects.toThrow(/No worktree/);
    });
});

describe("disposeTaskWorktree", () => {
    it("removes the worktree + branch and clears git state", async () => {
        setGit();
        const { disposeTaskWorktree } = await svc();
        await disposeTaskWorktree("t1");
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "remove")).toBe(true);
        expect(gitCalls.some((a) => a[0] === "branch" && a.includes("-D"))).toBe(true);
        expect(projectsFixture[0].tasks[0].git).toBeNull();
    });

    it("keeps the branch when keepBranch is set", async () => {
        setGit();
        const { disposeTaskWorktree } = await svc();
        await disposeTaskWorktree("t1", { keepBranch: true });
        expect(gitCalls.some((a) => a[0] === "branch" && a.includes("-D"))).toBe(false);
    });
});
