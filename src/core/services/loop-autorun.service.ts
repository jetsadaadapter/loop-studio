import { getProjects, saveProjects, executeGitCommand, isHostProject, isOwnGitRepo } from "@/core/services/loop-projects.service";
import { runCollaborationLoop, type ResolvedLlm } from "@/core/services/loop-collaboration.service";
import { upsertKnowledgeEntry } from "@/core/services/loop-knowledge.service";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

// Auto-Run orchestrator: drains a project's backlog group-by-group, running the
// AI-team pipeline for each task, then closes tasks according to the risk gate:
//   GREEN/YELLOW + all checks passed → auto retro + git commit + kanban "done"
//   ORANGE/RED (or any failed check)  → stays at OBSERVE awaiting human approval
// Push is never automatic — the user publishes after reviewing the summary.

export type AutoRunOutcome = "done" | "awaiting_approval" | "failed";

export interface AutoRunTaskResult {
    taskId: string;
    name: string;
    outcome: AutoRunOutcome;
    detail: string;
}

export interface AutoRunState {
    running: boolean;
    startedAt: string;
    finishedAt?: string;
    currentTaskId?: string;
    currentTaskName?: string;
    total: number;
    results: AutoRunTaskResult[];
    stopRequested: boolean;
}

// One run per project at a time; state is in-memory (dev-server lifetime),
// matching how ACTIVE_PROCESSES works in loop-projects.service.
const RUNS = new Map<string, AutoRunState>();

export function getAutoRunStatus(projectId: string): AutoRunState | null {
    return RUNS.get(projectId) ?? null;
}

export function requestAutoRunStop(projectId: string): boolean {
    const state = RUNS.get(projectId);
    if (!state || !state.running) return false;
    state.stopRequested = true;
    return true;
}

/** Backlog tasks in run order: grouped by sprintId (first-seen order), insertion order within a group. */
export function selectBacklogTasks(tasks: LoopTask[], taskIds?: string[]): LoopTask[] {
    const backlog = tasks.filter(
        (t) => t.kanbanColumn === "backlog" && t.status === "pending" && (!taskIds?.length || taskIds.includes(t.id)),
    );
    const groupOrder = new Map<string, number>();
    for (const t of backlog) {
        const g = t.sprintId ?? t.id;
        if (!groupOrder.has(g)) groupOrder.set(g, groupOrder.size);
    }
    return [...backlog].sort(
        (a, b) => groupOrder.get(a.sprintId ?? a.id)! - groupOrder.get(b.sprintId ?? b.id)!,
    );
}

export function startAutoRun(projectId: string, llm: ResolvedLlm, taskIds?: string[]): { started: boolean; total: number; error?: string } {
    const existing = RUNS.get(projectId);
    if (existing?.running) return { started: false, total: 0, error: "An auto-run is already in progress for this project." };

    const project = getProjects().find((p) => p.id === projectId);
    if (!project) return { started: false, total: 0, error: "Project not found" };

    const queue = selectBacklogTasks(project.tasks ?? [], taskIds);
    if (queue.length === 0) return { started: false, total: 0, error: "No pending backlog tasks to run." };

    const state: AutoRunState = {
        running: true,
        startedAt: new Date().toISOString(),
        total: queue.length,
        results: [],
        stopRequested: false,
    };
    RUNS.set(projectId, state);

    void runQueue(projectId, project.path, llm, queue.map((t) => t.id), state);
    return { started: true, total: queue.length };
}

async function runQueue(projectId: string, projectPath: string, llm: ResolvedLlm, taskIds: string[], state: AutoRunState) {
    for (const taskId of taskIds) {
        if (state.stopRequested) break;

        const task = getProjects().find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
        if (!task) continue;

        state.currentTaskId = task.id;
        state.currentTaskName = task.name;
        mutateTask(projectId, taskId, (t) => {
            t.status = "running";
            t.kanbanColumn = "in_progress";
        });

        const instructions =
            `${task.name}. Target files: ${task.targetFiles.join(", ")}.` +
            ` Respect the safety nets: ${(task.safetyNets ?? []).join("; ") || "standard verification"}.`;

        const result = await runCollaborationLoop(projectId, taskId, projectPath, llm, instructions);

        if (!result.success) {
            mutateTask(projectId, taskId, (t) => { t.kanbanColumn = "todo"; });
            state.results.push({ taskId, name: task.name, outcome: "failed", detail: result.error ?? "Pipeline error" });
            // Failures are the most valuable knowledge — the next planner run
            // should know this area broke the pipeline.
            upsertKnowledgeEntry(projectId, {
                taskId,
                taskName: task.name,
                source: "auto-run",
                learnings: [`Pipeline failed on ${task.targetFiles.join(", ")}: ${result.error ?? "unknown error"}`],
            });
            continue;
        }

        // Auto-commit is never allowed on the host app: `git add -A` there
        // would sweep unrelated in-progress work into an AI commit.
        const host = isHostProject(projectPath);
        const lowRisk = task.riskTier === "GREEN" || task.riskTier === "YELLOW";
        if (!host && lowRisk && result.testsPassed && result.typecheckPassed) {
            const committed = await autoCloseTask(projectId, taskId, projectPath, task.name);
            state.results.push({
                taskId,
                name: task.name,
                outcome: "done",
                detail: committed ? "Auto-closed and committed." : "Auto-closed (nothing to commit).",
            });
        } else {
            const reason = host
                ? "host app — auto-commit is disabled, review and approve manually"
                : lowRisk
                    ? `checks incomplete (tests ${result.testsPassed ? "passed" : "failed"}, typecheck ${result.typecheckPassed ? "passed" : "failed"})`
                    : `risk tier ${task.riskTier} requires human review`;
            mutateTask(projectId, taskId, (t) => {
                t.activities.push({
                    id: `act-approval-${Date.now()}`,
                    taskId,
                    stage: "OBSERVE",
                    action: "awaiting_approval",
                    message: `Auto-run paused before commit: ${reason}.`,
                    timestamp: new Date().toISOString(),
                });
            });
            state.results.push({ taskId, name: task.name, outcome: "awaiting_approval", detail: reason });
            // Only record check failures — host/risk-tier holds are policy, not learnings.
            if (!result.testsPassed || !result.typecheckPassed) {
                upsertKnowledgeEntry(projectId, {
                    taskId,
                    taskName: task.name,
                    source: "auto-run",
                    learnings: [
                        `Checks incomplete on ${task.targetFiles.join(", ")}: ` +
                        `tests ${result.testsPassed ? "passed" : "failed"}, typecheck ${result.typecheckPassed ? "passed" : "failed"}.`,
                    ],
                });
            }
        }
    }

    state.running = false;
    state.currentTaskId = undefined;
    state.currentTaskName = undefined;
    state.finishedAt = new Date().toISOString();
}

/** Fill the retro, mark LEARN/done, and commit the work. Returns true if a commit was made. */
async function autoCloseTask(projectId: string, taskId: string, projectPath: string, taskName: string): Promise<boolean> {
    mutateTask(projectId, taskId, (t) => {
        t.retroAnswers = {
            testsProven: "Auto-run: Vitest suite for the modified file passed.",
            envVerified: "Auto-run: verified in the local dev environment only.",
            sideEffects: "Auto-run: tsc --noEmit passed; no type-level regressions detected.",
        };
        t.status = "completed";
        t.currentStage = "LEARN";
        t.kanbanColumn = "done";
    });

    try {
        // Never `git add -A` against a parent repo: a project without its own
        // git root (e.g. a git-less folder nested in the host's .projects/)
        // would stage the surrounding repository's files instead.
        if (!(await isOwnGitRepo(projectPath))) return false;
        await executeGitCommand(projectPath, ["add", "-A"]);
        await executeGitCommand(projectPath, ["commit", "-m", `feat(auto-run): ${taskName}`]);
        return true;
    } catch {
        // "nothing to commit" or git unavailable — the task is still closed.
        return false;
    }
}

function mutateTask(projectId: string, taskId: string, fn: (task: LoopTask) => void) {
    const projects = getProjects();
    const task = projects.find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
    if (!task) return;
    fn(task);
    task.updatedAt = new Date().toISOString();
    saveProjects(projects);
}
