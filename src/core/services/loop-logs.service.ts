import fs from "fs";
import path from "path";

// Per-task log stream fan-out. A task's process output is appended to
// .antigravity/log-<taskId>.txt (persistence) and pushed to in-memory listeners;
// the logs SSE route (GET .../tasks/[taskId]/logs) reads the file once on connect
// then subscribes for live chunks. Split out of loop-projects.service.ts (300-line
// rule); that module re-exports everything here.

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
        const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);
        fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
        fs.appendFileSync(logFilePath, data);
    } catch {
        // Best-effort persistence — still fan out to live listeners below.
    }
    notifyLogListeners(taskId, data);
}
