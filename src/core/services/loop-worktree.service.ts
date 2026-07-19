import path from "path";
import fs from "fs";
import {
    executeGitCommand,
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
function findTask(taskId: string): { projectPath: string; task: { id: string; git?: TaskGit | null } } | null {
    for (const project of getProjects()) {
        const task = project.tasks?.find((t) => t.id === taskId);
        if (task) return { projectPath: project.path, task };
    }
    return null;
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

    fs.mkdirSync(worktreesRoot(), { recursive: true });

    // Reuse the branch if it already exists; otherwise create it off baseSha.
    const branchExists = await executeGitCommand(projectPath, ["rev-parse", "--verify", "--quiet", branch])
        .then(() => true)
        .catch(() => false);
    const addArgs = branchExists
        ? ["worktree", "add", dir, branch]
        : ["worktree", "add", dir, "-b", branch, baseSha];
    await executeGitCommand(projectPath, addArgs);

    const git: TaskGit = { worktreeDir: dir, branch, baseSha, checkpoints: [], integration: null };
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
