import path from "path";
import fs from "fs";
import {
    executeGitCommand,
    executeGhCommand,
    isOwnGitRepo,
    getProjects,
    saveProjects,
} from "@/core/services/loop-projects.service";
import type { TaskGit, TaskCheckpoint, TaskStage } from "@/core/interfaces/loop-projects.interface";

// Per-task git isolation: give each task its own worktree + branch so an agent's
// edits are isolated, checkpointed, and undoable. See
// docs/branch-per-task-checkpoint.md. Built on the executeGitCommand primitive.
// Worktrees live under this app's runtime state dir (gitignored), NOT inside the
// target repo, so the target repo's working tree stays pristine.

const worktreesRoot = () => path.join(process.cwd(), ".antigravity", "worktrees");

export function taskWorktreeDir(taskId: string): string {
    return path.join(worktreesRoot(), taskId);
}

export function taskBranchName(taskId: string): string {
    return `loop/task-${taskId}`;
}

/** Locate the project + task for a taskId (git ops need the target repo path). */
function findTask(taskId: string): { projectPath: string; useWorktree: boolean; task: { id: string; git?: TaskGit | null } } | null {
    for (const project of getProjects()) {
        const task = project.tasks?.find((t) => t.id === taskId);
        if (task) return { projectPath: project.path, useWorktree: !!project.useWorktree, task };
    }
    return null;
}

/**
 * The directory a task's agent should read/edit/run in: the task's worktree when
 * its project opted into `useWorktree` (created on first use), otherwise the repo
 * path itself. Always falls back to the repo path on any error (non-git target,
 * git failure) so a task never gets blocked — matching the legacy direct-edit path.
 */
export async function resolveTaskCwd(taskId: string): Promise<string> {
    const found = findTask(taskId);
    if (!found) throw new Error(`Task not found: ${taskId}`);
    if (!found.useWorktree) return found.projectPath;
    try {
        const git = await ensureTaskWorktree(taskId);
        return git.worktreeDir;
    } catch (e) {
        console.error(`[worktree] falling back to direct edits for ${taskId}:`, e instanceof Error ? e.message : e);
        return found.projectPath;
    }
}

/** Persist a task's git state back to the store. */
function saveTaskGit(taskId: string, git: TaskGit | null): void {
    const projects = getProjects();
    for (const project of projects) {
        const task = project.tasks?.find((t) => t.id === taskId);
        if (task) {
            task.git = git;
            task.updatedAt = new Date().toISOString();
            saveProjects(projects);
            return;
        }
    }
}

/**
 * Create (or reuse) the task's worktree + branch off `base` (default: the repo's
 * current HEAD). Idempotent: a re-run with an existing worktree returns it.
 * Throws if the target is not a git repo root — callers fall back to direct edits.
 */
export async function ensureTaskWorktree(taskId: string, base?: string): Promise<TaskGit> {
    const found = findTask(taskId);
    if (!found) throw new Error(`Task not found: ${taskId}`);
    const { projectPath, task } = found;

    // Reuse an existing, still-present worktree (idempotent re-run).
    if (task.git && fs.existsSync(task.git.worktreeDir)) return task.git;

    if (!(await isOwnGitRepo(projectPath))) {
        throw new Error(`Target is not a git repo root: ${projectPath}`);
    }

    const dir = taskWorktreeDir(taskId);
    const branch = taskBranchName(taskId);
    const baseSha = await executeGitCommand(projectPath, ["rev-parse", base || "HEAD"]);
    // The branch we cut from, for `merge` integration ("" when detached HEAD).
    const baseBranch = base || (await executeGitCommand(projectPath, ["branch", "--show-current"]).catch(() => ""));

    fs.mkdirSync(worktreesRoot(), { recursive: true });

    // Reuse the branch if it already exists; otherwise create it off baseSha.
    const branchExists = await executeGitCommand(projectPath, ["rev-parse", "--verify", "--quiet", branch])
        .then(() => true)
        .catch(() => false);
    const addArgs = branchExists
        ? ["worktree", "add", dir, branch]
        : ["worktree", "add", dir, "-b", branch, baseSha];
    await executeGitCommand(projectPath, addArgs);

    const git: TaskGit = { worktreeDir: dir, branch, baseSha, baseBranch, checkpoints: [], integration: null };
    saveTaskGit(taskId, git);
    return git;
}

/**
 * Commit the current worktree state as a checkpoint (rollback target). Returns
 * null when there is nothing to commit. Never runs the repo's own hooks.
 */
export async function checkpoint(
    taskId: string,
    opts: { stage: TaskStage; label: string },
): Promise<TaskCheckpoint | null> {
    const found = findTask(taskId);
    if (!found?.task.git) throw new Error(`No worktree for task: ${taskId}`);
    const git = found.task.git;
    const dir = git.worktreeDir;

    const dirty = await executeGitCommand(dir, ["status", "--porcelain"]);
    if (!dirty.trim()) return null; // nothing changed since the last checkpoint

    const step = git.checkpoints.length + 1;
    const message = `loop-checkpoint(${opts.stage}): ${opts.label}\n\ntaskId=${taskId} step=${step}`;
    await executeGitCommand(dir, ["add", "-A"]);
    await executeGitCommand(dir, ["commit", "--no-verify", "-m", message]);
    const sha = await executeGitCommand(dir, ["rev-parse", "HEAD"]);

    const cp: TaskCheckpoint = { sha, label: opts.label, stage: opts.stage, createdAt: new Date().toISOString() };
    saveTaskGit(taskId, { ...git, checkpoints: [...git.checkpoints, cp] });
    return cp;
}

/**
 * Hard-reset the worktree to a prior checkpoint and drop the checkpoints after it.
 * `sha` must be one of the task's recorded checkpoints.
 */
export async function rollbackTo(taskId: string, sha: string): Promise<void> {
    const found = findTask(taskId);
    if (!found?.task.git) throw new Error(`No worktree for task: ${taskId}`);
    const git = found.task.git;
    const idx = git.checkpoints.findIndex((c) => c.sha === sha);
    if (idx === -1) throw new Error(`Unknown checkpoint: ${sha}`);

    await executeGitCommand(git.worktreeDir, ["reset", "--hard", sha]);
    saveTaskGit(taskId, { ...git, checkpoints: git.checkpoints.slice(0, idx + 1) });
}

export function listCheckpoints(taskId: string): TaskCheckpoint[] {
    return findTask(taskId)?.task.git?.checkpoints ?? [];
}

/**
 * Record how a finished task's branch is integrated back. `leave-branch` (the
 * default, non-destructive) just records the decision — the branch already holds
 * the work for the operator to merge. `open-pr` / `merge` are not implemented yet
 * (they need a remote/gh runner and conflict handling — a follow-up).
 */
export async function integrateTask(
    taskId: string,
    mode: "leave-branch" | "open-pr" | "merge",
): Promise<NonNullable<TaskGit["integration"]>> {
    const found = findTask(taskId);
    if (!found?.task.git) throw new Error(`No worktree for task: ${taskId}`);
    const { projectPath } = found;
    const git = found.task.git;

    // integrateTask is operator-initiated (via the worktree route), so a chosen
    // merge is an explicit decision — the "never AUTO-merge RED/ORANGE" rule applies
    // to the auto paths, which never call this with a destructive mode.
    let integration: NonNullable<TaskGit["integration"]>;
    if (mode === "leave-branch") {
        integration = { mode, ref: git.branch };
    } else if (mode === "open-pr") {
        const remotes = await executeGitCommand(projectPath, ["remote"]).catch(() => "");
        if (!remotes.trim()) throw new Error("open-pr needs a git remote; none is configured.");
        await executeGitCommand(projectPath, ["push", "-u", "origin", git.branch]);
        const prUrl = (await executeGhCommand(projectPath, ["pr", "create", "--head", git.branch, "--fill"])).trim();
        integration = { mode, prUrl };
    } else {
        // merge: fast-forward ONLY into the base branch — never auto-resolve a
        // divergence. `fetch . <task>:<base>` updates the base ref iff it's a FF.
        if (!git.baseBranch) throw new Error("merge needs a known base branch (worktree predates baseBranch tracking).");
        await executeGitCommand(projectPath, ["fetch", ".", `${git.branch}:${git.baseBranch}`])
            .catch(() => { throw new Error(`Cannot fast-forward ${git.baseBranch} (it moved, or is checked out) — merge manually.`); });
        integration = { mode, ref: git.baseBranch };
    }

    saveTaskGit(taskId, { ...git, integration });
    return integration;
}

/**
 * Remove the task's worktree (and optionally its branch). Safe to call when no
 * worktree exists. Clears the task's git state.
 */
export async function disposeTaskWorktree(
    taskId: string,
    opts: { keepBranch?: boolean } = {},
): Promise<void> {
    const found = findTask(taskId);
    if (!found?.task.git) return;
    const { projectPath, task } = found;
    const git = task.git!;

    await executeGitCommand(projectPath, ["worktree", "remove", "--force", git.worktreeDir]).catch(() => {});
    if (!opts.keepBranch) {
        await executeGitCommand(projectPath, ["branch", "-D", git.branch]).catch(() => {});
    }
    saveTaskGit(taskId, null);
}

// Boot-time worktree maintenance lives in ./loop-worktree-recovery (300-line cap).
export { recoverTaskWorktrees, gcTaskWorktrees } from "./loop-worktree-recovery";
