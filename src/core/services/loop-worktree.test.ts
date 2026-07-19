import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

// Mutable state driving the mocked git primitive + store.
let projectsFixture: { id: string; path: string; tasks: LoopTask[] }[] = [];
let branchExists = false;
let dirty = "";
let isRepo = true;
const gitCalls: string[][] = [];

vi.mock("fs", () => ({
    default: { existsSync: vi.fn(() => false), mkdirSync: vi.fn() },
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

beforeEach(() => {
    projectsFixture = [{ id: "p1", path: "/repo", tasks: [task()] }];
    branchExists = false;
    dirty = "";
    isRepo = true;
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
        projectsFixture[0].tasks[0].git = {
            worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
        };
        dirty = " M server.js";
        const { checkpoint } = await svc();
        const cp = await checkpoint("t1", { stage: "BUILD", label: "add health endpoint" });
        expect(cp?.sha).toBe("headsha");
        expect(cp?.label).toBe("add health endpoint");
        expect(gitCalls.some((a) => a[0] === "commit")).toBe(true);
        expect(projectsFixture[0].tasks[0].git?.checkpoints).toHaveLength(1);
    });

    it("returns null (no commit) when the worktree is clean", async () => {
        projectsFixture[0].tasks[0].git = {
            worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
        };
        dirty = "";
        const { checkpoint } = await svc();
        const cp = await checkpoint("t1", { stage: "BUILD", label: "noop" });
        expect(cp).toBeNull();
        expect(gitCalls.some((a) => a[0] === "commit")).toBe(false);
    });
});

describe("rollbackTo", () => {
    it("resets to a checkpoint and drops later ones", async () => {
        projectsFixture[0].tasks[0].git = {
            worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "b",
            checkpoints: [
                { sha: "a", label: "1", stage: "BUILD", createdAt: "" },
                { sha: "b2", label: "2", stage: "BUILD", createdAt: "" },
                { sha: "c", label: "3", stage: "BUILD", createdAt: "" },
            ],
            integration: null,
        };
        const { rollbackTo } = await svc();
        await rollbackTo("t1", "b2");
        expect(gitCalls.some((a) => a[0] === "reset" && a.includes("b2"))).toBe(true);
        expect(projectsFixture[0].tasks[0].git?.checkpoints.map((c) => c.sha)).toEqual(["a", "b2"]);
    });

    it("throws on an unknown checkpoint", async () => {
        projectsFixture[0].tasks[0].git = {
            worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
        };
        const { rollbackTo } = await svc();
        await expect(rollbackTo("t1", "nope")).rejects.toThrow(/Unknown checkpoint/);
    });
});

describe("disposeTaskWorktree", () => {
    it("removes the worktree + branch and clears git state", async () => {
        projectsFixture[0].tasks[0].git = {
            worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
        };
        const { disposeTaskWorktree } = await svc();
        await disposeTaskWorktree("t1");
        expect(gitCalls.some((a) => a[0] === "worktree" && a[1] === "remove")).toBe(true);
        expect(gitCalls.some((a) => a[0] === "branch" && a.includes("-D"))).toBe(true);
        expect(projectsFixture[0].tasks[0].git).toBeNull();
    });

    it("keeps the branch when keepBranch is set", async () => {
        projectsFixture[0].tasks[0].git = {
            worktreeDir: "/wt", branch: "loop/task-t1", baseSha: "b", checkpoints: [], integration: null,
        };
        const { disposeTaskWorktree } = await svc();
        await disposeTaskWorktree("t1", { keepBranch: true });
        expect(gitCalls.some((a) => a[0] === "branch" && a.includes("-D"))).toBe(false);
    });
});
