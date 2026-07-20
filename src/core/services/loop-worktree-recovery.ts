import path from "path";
import fs from "fs";
import { executeGitCommand, isOwnGitRepo, getProjects, saveProjects } from "@/core/services/loop-projects.service";

// Boot-time maintenance for per-task worktrees (called from instrumentation.ts):
// reconcile worktrees orphaned by a restart, then GC dirs no task references.
// Split out of loop-worktree.service to keep that file under the 300-line cap.

const worktreesRoot = () => path.join(process.cwd(), ".antigravity", "worktrees");

async function branchExists(projectPath: string, branch: string): Promise<boolean> {
    return executeGitCommand(projectPath, ["rev-parse", "--verify", "--quiet", branch])
        .then(() => true)
        .catch(() => false);
}

/**
 * Reconcile persisted task worktrees after an app restart (like recoverTmuxBridges).
 * For each task that recorded git state:
 *  - worktree dir + branch present → resume (no-op);
 *  - branch present but worktree dir gone → re-add the worktree from the branch;
 *  - branch gone / non-git target → clear the task's git state (stale).
 * Best-effort and never throws — a recovery failure must not block boot.
 */
export async function recoverTaskWorktrees(): Promise<{ resumed: string[]; readded: string[]; stale: string[] }> {
    const summary = { resumed: [] as string[], readded: [] as string[], stale: [] as string[] };
    try {
        const projects = getProjects();
        let changed = false;
        for (const project of projects) {
            for (const task of project.tasks ?? []) {
                const git = task.git;
                if (!git) continue;
                const pp = project.path;

                if (!(await isOwnGitRepo(pp)) || !(await branchExists(pp, git.branch))) {
                    await executeGitCommand(pp, ["worktree", "remove", "--force", git.worktreeDir]).catch(() => {});
                    task.git = null;
                    changed = true;
                    summary.stale.push(task.id);
                    continue;
                }
                if (fs.existsSync(git.worktreeDir)) {
                    summary.resumed.push(task.id);
                    continue;
                }
                // Branch present but the worktree dir is gone → re-add from the branch.
                await executeGitCommand(pp, ["worktree", "prune"]).catch(() => {});
                try {
                    await executeGitCommand(pp, ["worktree", "add", git.worktreeDir, git.branch]);
                    summary.readded.push(task.id);
                } catch {
                    task.git = null;
                    changed = true;
                    summary.stale.push(task.id);
                }
            }
        }
        if (changed) saveProjects(projects);
    } catch (e) {
        console.error("[worktree] recovery pass failed:", e instanceof Error ? e.message : e);
    }
    return summary;
}

/**
 * Reclaim disk from ORPHANED worktree dirs — a dir under .antigravity/worktrees/
 * that no task's git state references (task deleted, or its git state cleared by
 * recovery). Deliberately conservative: dirs still referenced by a task (open OR
 * closed) are kept, so this never conflicts with the recovery pass and never
 * removes a branch. Disposal of a finished task's worktree is the integrate/LEARN
 * step's job, not GC's. Best-effort; never throws.
 */
export async function gcTaskWorktrees(): Promise<{ removed: string[]; kept: string[] }> {
    const summary = { removed: [] as string[], kept: [] as string[] };
    const root = worktreesRoot();
    let entries: string[];
    try {
        entries = fs.readdirSync(root);
    } catch {
        return summary; // no worktrees root yet → nothing to GC
    }

    const projects = getProjects();
    const referenced = new Set<string>();
    for (const project of projects) {
        for (const task of project.tasks ?? []) {
            if (task.git?.worktreeDir) referenced.add(task.git.worktreeDir);
        }
    }

    for (const name of entries) {
        const dir = path.join(root, name);
        if (referenced.has(dir)) {
            summary.kept.push(name);
            continue;
        }
        try {
            fs.rmSync(dir, { recursive: true, force: true });
        } catch { /* best-effort */ }
        summary.removed.push(name);
    }

    // Clean any stale worktree registrations the removed dirs left behind.
    if (summary.removed.length > 0) {
        for (const project of projects) {
            await executeGitCommand(project.path, ["worktree", "prune"]).catch(() => {});
        }
    }
    return summary;
}
