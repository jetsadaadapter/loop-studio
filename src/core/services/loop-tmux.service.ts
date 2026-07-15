import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

// Run an agent CLI inside a detached tmux session instead of as a direct child of
// the Next server. The session (loop-<taskId>) survives an app restart and is
// attachable (`tmux attach -t loop-<taskId>`); stdout is captured to a file for
// parsing, stderr streams to the task log. Used by the bridge auto-fulfill worker
// when LOOP_BRIDGE_TMUX is set. Prompt/args never touch shell evaluation — every
// argv element is single-quote-escaped into a controlled wrapper script.

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
        try {
            tmuxCache = spawnSync("tmux", ["-V"], { stdio: "ignore" }).status === 0;
        } catch {
            tmuxCache = false;
        }
    }
    return tmuxCache;
}

const safe = (taskId: string) => String(taskId).replace(/[^A-Za-z0-9._-]/g, "_");
export const tmuxSessionName = (taskId: string) => `loop-${safe(taskId)}`;

interface RunArgs {
    taskId: string;
    bin: string;
    args: string[];
    cwd: string;
    timeoutMs: number;
    onLog: (data: string) => void;
}

/** Run the agent in a detached tmux session; resolve once it exits or times out. */
export function runAgentInTmux(a: RunArgs): Promise<{ exitCode: number; stdout: string; timedOut: boolean }> {
    const session = tmuxSessionName(a.taskId);
    const dir = path.join(process.cwd(), ".antigravity", "tmux", safe(a.taskId));
    const wrapper = path.join(dir, "wrapper.sh");
    const outPath = path.join(dir, "out");
    const errPath = path.join(dir, "err");
    const exitPath = path.join(dir, "exit");

    const readMaybe = (p: string) => { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } };
    const cleanup = () => {
        try { spawnSync("tmux", ["kill-session", "-t", session], { stdio: "ignore" }); } catch { /* gone */ }
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
    };

    return new Promise((resolve) => {
        try {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(wrapper, buildWrapperScript(a.bin, a.args, a.cwd, outPath, errPath, exitPath));
        } catch (e) {
            a.onLog(`[tmux] setup failed: ${e instanceof Error ? e.message : String(e)}\n`);
            return resolve({ exitCode: 1, stdout: "", timedOut: false });
        }

        // Fresh run: drop any stale session with this name, then start detached.
        spawnSync("tmux", ["kill-session", "-t", session], { stdio: "ignore" });
        const start = spawnSync("tmux", ["new-session", "-d", "-s", session, `bash ${shq(wrapper)}`], { stdio: "ignore" });
        if (start.status !== 0) {
            a.onLog(`[tmux] failed to start session ${session}.\n`);
            cleanup();
            return resolve({ exitCode: 1, stdout: "", timedOut: false });
        }
        a.onLog(`[tmux] running in session ${session} — watch with: tmux attach -t ${session}\n`);

        const began = Date.now();
        let errLen = 0;
        const tick = () => {
            // Stream newly-appended stderr to the task log.
            const err = readMaybe(errPath);
            if (err.length > errLen) { a.onLog(err.slice(errLen)); errLen = err.length; }

            if (fs.existsSync(exitPath)) {
                const exitCode = parseInt(readMaybe(exitPath).trim(), 10);
                const stdout = readMaybe(outPath);
                cleanup();
                return resolve({ exitCode: Number.isNaN(exitCode) ? 1 : exitCode, stdout, timedOut: false });
            }
            if (Date.now() - began > a.timeoutMs) {
                a.onLog(`[tmux] timed out after ${Math.round(a.timeoutMs / 1000)}s — killing ${session}.\n`);
                cleanup();
                return resolve({ exitCode: 1, stdout: "", timedOut: true });
            }
            setTimeout(tick, 2000);
        };
        setTimeout(tick, 2000);
    });
}
