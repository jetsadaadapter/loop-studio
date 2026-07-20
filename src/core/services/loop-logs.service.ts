import fs from "fs";
import path from "path";
import { assertSafeStoreId } from "./json-store";

// Per-task log stream fan-out. A task's process output is appended to
// .antigravity/log-<taskId>.txt (persistence) and pushed to in-memory listeners;
// the logs SSE route (GET .../tasks/[taskId]/logs) reads the file once on connect
// then subscribes for live chunks. Split out of loop-projects.service.ts (300-line
// rule); that module re-exports everything here.

// Single place that turns a task/project id into its on-disk log path. Runs the
// id through assertSafeStoreId first so a crafted id (e.g. "../../etc/foo") can
// never escape .antigravity — the SSE read route and every writer share this, so
// the traversal guard is applied uniformly instead of per-call. Throws on a
// malformed id (callers surface it as a 4xx/5xx rather than touching the fs).
export function taskLogPath(taskId: string): string {
    return path.join(process.cwd(), ".antigravity", `log-${assertSafeStoreId(taskId)}.txt`);
}

/** Log path for a project-level "Live Run" (build/lint/test/dev), keyed by project id. */
export function runLogPath(projectId: string): string {
    return path.join(process.cwd(), ".antigravity", `log-run-${assertSafeStoreId(projectId)}.txt`);
}

const LOG_LISTENERS = new Map<string, ((data: string) => void)[]>();

export function subscribeToLogs(taskId: string, callback: (data: string) => void) {
    if (!LOG_LISTENERS.has(taskId)) {
        LOG_LISTENERS.set(taskId, []);
    }
    LOG_LISTENERS.get(taskId)!.push(callback);
    return () => {
        const list = LOG_LISTENERS.get(taskId) || [];
        const filtered = list.filter((l) => l !== callback);
        LOG_LISTENERS.set(taskId, filtered);
    };
}

/** Fan a chunk out to live listeners only (no persistence). Used by the process
 *  runner, whose caller already appends the same chunk to the log file. */
export function notifyLogListeners(taskId: string, data: string): void {
    const listeners = LOG_LISTENERS.get(taskId) || [];
    listeners.forEach((l) => l(data));
}

/** Persist a line to .antigravity/log-<taskId>.txt (so a late-connecting
 *  LogTerminal still sees it) AND fan it out to live listeners. Used by callers
 *  that stream output without going through runProjectCommand (e.g. the
 *  auto-fulfill bridge worker). */
export function publishTaskLog(taskId: string, data: string): void {
    try {
        const logFilePath = taskLogPath(taskId);
        fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
        fs.appendFileSync(logFilePath, data);
    } catch {
        // Best-effort persistence — still fan out to live listeners below.
    }
    notifyLogListeners(taskId, data);
}
