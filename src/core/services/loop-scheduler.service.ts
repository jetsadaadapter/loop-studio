import { getProjects, saveProjects } from "@/core/services/loop-projects.service";
import { resolveLoopLlm } from "@/core/services/loop-llm.service";
import { startAutoRun, getAutoRunStatus, selectBacklogTasks } from "@/core/services/loop-autorun.service";

// The heartbeat: a single server-side tick that fires auto-run on a cadence so
// the backlog drains without the user clicking "Plan from Goal" each time.
// Headless runs use the server env API key (there is no per-user key here);
// with no env key set, the scheduler throttles and reports instead of spinning.

const TICK_MS = 60_000; // check once a minute; each project's own interval gates it
let timer: ReturnType<typeof setInterval> | null = null;

function isDue(lastRunAt: string | undefined, intervalMinutes: number, now: number): boolean {
    if (!lastRunAt) return true;
    const last = Date.parse(lastRunAt);
    if (Number.isNaN(last)) return true;
    return now - last >= intervalMinutes * 60_000;
}

/**
 * One heartbeat pass. Synchronous through the read→mutate→save window (no await)
 * so it can't race a concurrent store write; startAutoRun itself returns
 * immediately and runs the pipeline in the background.
 */
export function schedulerTick(): void {
    const now = Date.now();
    const projects = getProjects();
    const toStart: string[] = [];
    let changed = false;

    for (const project of projects) {
        const schedule = project.schedule;
        if (!schedule?.enabled) continue;
        if (!isDue(schedule.lastRunAt, schedule.intervalMinutes, now)) continue;
        // A run already in flight for this project — let it finish, re-check next tick.
        if (getAutoRunStatus(project.id)?.running) continue;

        schedule.lastRunAt = new Date(now).toISOString();
        changed = true;

        if (!resolveLoopLlm(undefined)) {
            schedule.lastResult = "skipped: no server API key (set ANTHROPIC_API_KEY or GEMINI_API_KEY)";
            continue;
        }
        if (selectBacklogTasks(project.tasks ?? []).length === 0) {
            schedule.lastResult = "skipped: no backlog tasks to run";
            continue;
        }
        schedule.lastResult = "starting…";
        toStart.push(project.id);
    }

    if (changed) saveProjects(projects);

    // Kick off runs after persisting the schedule bump — startAutoRun re-reads
    // the store, and this keeps the mutate→save window free of side effects.
    for (const projectId of toStart) {
        const llm = resolveLoopLlm(undefined);
        if (!llm) continue;
        const result = startAutoRun(projectId, llm);
        recordResult(projectId, result.started ? `started ${result.total} task(s)` : result.error ?? "did not start");
    }
}

function recordResult(projectId: string, message: string): void {
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project?.schedule) return;
    project.schedule.lastResult = message;
    saveProjects(projects);
}

/** Start the heartbeat once per server process. Idempotent; safe to call from instrumentation. */
export function startScheduler(): void {
    if (timer) return;
    // unref so the heartbeat never keeps the process alive on its own.
    timer = setInterval(() => {
        try {
            schedulerTick();
        } catch (e) {
            console.error("[scheduler] tick failed:", e);
        }
    }, TICK_MS);
    timer.unref?.();
    console.log("[scheduler] heartbeat started");
}
