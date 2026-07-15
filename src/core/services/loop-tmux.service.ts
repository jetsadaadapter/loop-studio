import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

// Run an agent CLI inside a detached tmux session instead of as a direct child of
// the Next server. The session (loop-<taskId>) survives an app restart and is
// attachable (`tmux attach -t loop-<taskId>`); stdout is captured to a file for
// parsing, stderr streams to the task log. Used by the bridge auto-fulfill worker
// when LOOP_BRIDGE_TMUX is set. Prompt/args never touch shell evaluation — every
// argv element is single-quote-escaped into a controlled wrapper script.
//
// A `meta.json` in each run dir lets the worker recover orphaned runs after an app
// restart (see recoverTmuxBridges): the run dir persists until finalize, so a
// crash mid-run leaves the signal on disk.

/** POSIX single-quote escape: wrap in '…' and turn any ' into '\''. Neutralizes
 *  every shell metacharacter (;, `, $(), spaces, quotes) — the value is data. */
export function shq(s: string): string {
    return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

/** The wrapper script tmux runs: cd into the project, run the agent with stdout →
 *  out file / stderr → err file, then record the exit code. Pure + exported so the
 *  injection-safety of the quoting can be unit-tested without spawning tmux. */
export function buildWrapperScript(
    bin: string,
    args: string[],
    cwd: string,
    outPath: string,
    errPath: string,
    exitPath: string,
): string {
    const cmd = [bin, ...args].map(shq).join(" ");
    return [
        `cd ${shq(cwd)} || exit 1`,
        `${cmd} > ${shq(outPath)} 2> ${shq(errPath)}`,
        `echo $? > ${shq(exitPath)}`,
        "",
    ].join("\n");
}

let tmuxCache: boolean | null = null;
export function tmuxAvailable(): boolean {
    if (tmuxCache === null) {
        try { tmuxCache = spawnSync("tmux", ["-V"], { stdio: "ignore" }).status === 0; }
        catch { tmuxCache = false; }
    }
    return tmuxCache;
}

const safe = (taskId: string) => String(taskId).replace(/[^A-Za-z0-9._-]/g, "_");
export const tmuxSessionName = (taskId: string) => `loop-${safe(taskId)}`;
const TMUX_ROOT = () => path.join(process.cwd(), ".antigravity", "tmux");
export const tmuxWorkDir = (taskId: string) => path.join(TMUX_ROOT(), safe(taskId));
const runPaths = (taskId: string) => {
    const dir = tmuxWorkDir(taskId);
    return { dir, wrapper: path.join(dir, "wrapper.sh"), out: path.join(dir, "out"), err: path.join(dir, "err"), exit: path.join(dir, "exit"), meta: path.join(dir, "meta.json") };
};

export interface TmuxRunMeta { taskId: string; projectId: string; bridgeId: string; agent: string; }

export function readTmuxMeta(dir: string): TmuxRunMeta | null {
    try { return JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")) as TmuxRunMeta; }
    catch { return null; }
}

/** Every run dir under .antigravity/tmux that carries a meta.json (a run that was
 *  started but not yet finalized — the recovery candidates). */
export function listTmuxRunDirs(): string[] {
    try {
        return fs.readdirSync(TMUX_ROOT())
            .map((name) => path.join(TMUX_ROOT(), name))
            .filter((dir) => fs.existsSync(path.join(dir, "meta.json")));
    } catch { return []; }
}

/** Whether a run's exit file exists yet, and (if so) its exit code + captured stdout. */
export function readTmuxOutcome(taskId: string): { hasExit: boolean; exitCode: number; stdout: string } {
    const p = runPaths(taskId);
    const hasExit = fs.existsSync(p.exit);
    return { hasExit, exitCode: hasExit ? (parseInt(readMaybe(p.exit).trim(), 10) || 0) : 1, stdout: readMaybe(p.out) };
}

export function tmuxSessionAlive(taskId: string): boolean {
    try { return spawnSync("tmux", ["has-session", "-t", tmuxSessionName(taskId)], { stdio: "ignore" }).status === 0; }
    catch { return false; }
}

export function cleanupTmuxRun(taskId: string): void {
    try { spawnSync("tmux", ["kill-session", "-t", tmuxSessionName(taskId)], { stdio: "ignore" }); } catch { /* gone */ }
    try { fs.rmSync(tmuxWorkDir(taskId), { recursive: true, force: true }); } catch { /* best effort */ }
}

interface RunResult { exitCode: number; stdout: string; timedOut: boolean }
const readMaybe = (p: string) => { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } };

/** Poll an existing run's exit file until it appears or the timeout elapses,
 *  streaming newly-appended stderr to onLog. Cleans up the session + dir at the
 *  end. Used both for a fresh run and to resume an orphaned run after a restart. */
export function pollTmuxRun(taskId: string, timeoutMs: number, onLog: (s: string) => void): Promise<RunResult> {
    const p = runPaths(taskId);
    const began = Date.now();
    let errLen = 0;
    return new Promise((resolve) => {
        const tick = () => {
            const err = readMaybe(p.err);
            if (err.length > errLen) { onLog(err.slice(errLen)); errLen = err.length; }

            if (fs.existsSync(p.exit)) {
                const exitCode = parseInt(readMaybe(p.exit).trim(), 10);
                const stdout = readMaybe(p.out);
                cleanupTmuxRun(taskId);
                return resolve({ exitCode: Number.isNaN(exitCode) ? 1 : exitCode, stdout, timedOut: false });
            }
            if (Date.now() - began > timeoutMs) {
                onLog(`[tmux] timed out after ${Math.round(timeoutMs / 1000)}s — killing ${tmuxSessionName(taskId)}.\n`);
                cleanupTmuxRun(taskId);
                return resolve({ exitCode: 1, stdout: "", timedOut: true });
            }
            setTimeout(tick, 2000);
        };
        setTimeout(tick, 2000);
    });
}

interface RunArgs { taskId: string; bin: string; args: string[]; cwd: string; timeoutMs: number; onLog: (s: string) => void; meta: Omit<TmuxRunMeta, "taskId"> }

/** Start the agent in a fresh detached tmux session and poll to completion. */
export function runAgentInTmux(a: RunArgs): Promise<RunResult> {
    const p = runPaths(a.taskId);
    const session = tmuxSessionName(a.taskId);
    try {
        fs.mkdirSync(p.dir, { recursive: true });
        fs.writeFileSync(p.wrapper, buildWrapperScript(a.bin, a.args, a.cwd, p.out, p.err, p.exit));
        fs.writeFileSync(p.meta, JSON.stringify({ taskId: a.taskId, ...a.meta }));
    } catch (e) {
        a.onLog(`[tmux] setup failed: ${e instanceof Error ? e.message : String(e)}\n`);
        return Promise.resolve({ exitCode: 1, stdout: "", timedOut: false });
    }
    spawnSync("tmux", ["kill-session", "-t", session], { stdio: "ignore" }); // drop any stale same-name session
    const start = spawnSync("tmux", ["new-session", "-d", "-s", session, `bash ${shq(p.wrapper)}`], { stdio: "ignore" });
    if (start.status !== 0) {
        a.onLog(`[tmux] failed to start session ${session}.\n`);
        cleanupTmuxRun(a.taskId);
        return Promise.resolve({ exitCode: 1, stdout: "", timedOut: false });
    }
    a.onLog(`[tmux] running in session ${session} — watch with: tmux attach -t ${session}\n`);
    return pollTmuxRun(a.taskId, a.timeoutMs, a.onLog);
}
