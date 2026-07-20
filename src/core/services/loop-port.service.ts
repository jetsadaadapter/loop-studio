import { spawnSync } from "child_process";

/**
 * Kill whatever process is LISTENing on a local TCP port (macOS/Linux, via lsof).
 * The reliable fallback for stopping a project's dev server when it isn't in the
 * in-memory process registry — e.g. one started before an app restart cleared it.
 *
 * `port` is validated to a positive integer and passed as a discrete argv element
 * (no shell), so there's no injection surface. Returns true if at least one
 * listening PID was signalled.
 */
export function killProcessOnPort(port: number): boolean {
    if (!Number.isInteger(port) || port <= 0) return false;
    try {
        const out = spawnSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
        const pids = (out.stdout || "")
            .split("\n")
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isInteger(n) && n > 0);
        if (pids.length === 0) return false;
        for (const pid of pids) {
            try { process.kill(pid, "SIGTERM"); } catch { /* already gone */ }
        }
        return true;
    } catch {
        return false;
    }
}
