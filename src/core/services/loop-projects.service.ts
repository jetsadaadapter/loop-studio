import fs from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import type { LoopProject, RiskTier, TaskStatus, KanbanColumn } from "@/core/interfaces/loop-projects.interface";
import { readJsonStore, writeJsonStore } from "./json-store";
import { notifyLogListeners } from "./loop-logs.service";

const PROJECTS_FILE_PATH = path.join(process.cwd(), ".antigravity", "loop-projects.json");

// In-memory registry of running child processes
export const ACTIVE_PROCESSES = new Map<string, ChildProcess>();

// A fresh store starts empty — projects are registered/bootstrapped by the user.
// Read/save semantics (corrupt-file backup, atomic writes, throwing on
// failure) live in json-store.ts. Re-read after any await before mutating.
export function getProjects(): LoopProject[] {
    return readJsonStore<LoopProject[]>(PROJECTS_FILE_PATH, []);
}

export function saveProjects(projects: LoopProject[]): void {
    writeJsonStore(PROJECTS_FILE_PATH, projects);
}

/**
 * The board's `kanbanColumn` is a separate field from `status` (so drag-and-drop
 * can reposition a card without an AI action forcing it back), but every place
 * that changes `status` server-side must keep them in sync — otherwise a task
 * already sitting in a column (e.g. "backlog" from creation) never visually
 * moves to "Done" when it completes. Mirrors the reverse mapping in the
 * reorder route (kanbanColumn -> status).
 */
export function kanbanColumnForStatus(status: TaskStatus): KanbanColumn {
    switch (status) {
        case "completed": return "done";
        case "running": return "in_progress";
        case "failed": return "todo";
        case "pending": return "backlog";
    }
}

/**
 * True when the registered project IS this running app's own repo. Guarded
 * operations (next build, auto-commit, dev server) are blocked for it: they
 * would overwrite the live .next output, sweep unrelated work into commits,
 * or fight over the port the app is serving on.
 */
export function isHostProject(projectPath: string): boolean {
    return path.resolve(projectPath) === process.cwd();
}

/**
 * Probes whether something is listening at `url`. Runs server-side (Node has
 * no CSP) so the browser's `connect-src 'self'` policy — which blocks a
 * client-side fetch to another localhost port — never gets in the way. Used
 * by the preview pane to tell "dev server not started yet" apart from a
 * normal page load, instead of letting the browser's own error page render
 * inside the iframe.
 */
/**
 * Reads back the port a project's own `previewUrl` claims (e.g.
 * "http://localhost:3001" → 3001). Returns undefined for a relative path or
 * a URL with no explicit port — nothing to pin the dev server to in that case.
 */
export function extractPreviewPort(previewUrl?: string): number | undefined {
    if (!previewUrl) return undefined;
    try {
        const port = new URL(previewUrl).port;
        return port ? Number(port) : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Picks a free port for a newly bootstrapped project, distinct from every
 * other registered project's previewUrl and from this host app's own port
 * (3000) — so two projects run concurrently never fight over the same
 * default `next dev`/`vite` port.
 */
export function allocatePreviewPort(projects: LoopProject[]): number {
    const used = new Set<number>([3000]);
    for (const p of projects) {
        const port = extractPreviewPort(p.previewUrl);
        if (port) used.add(port);
    }
    let port = 3001;
    while (used.has(port)) port++;
    return port;
}

export async function checkUrlReachable(url: string, timeoutMs = 2500): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal, redirect: "manual" });
        // Any HTTP response (even a 4xx/5xx from the app itself) means a server
        // is listening — only a network-level failure counts as "offline".
        return res.status > 0;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}

const RISK_SCAN_SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist"]);

// Trace fan-out (import references) of a file to determine Risk Tier.
// Async on purpose: the walk reads every source file in the target repo, and a
// sync version freezes the whole server (all routes + SSE) for its duration.
export async function calculateRiskTier(
    projectPath: string,
    relativeFilePath: string
): Promise<{ tier: RiskTier; count: number }> {
    let count = 0;
    try {
        // Remove extension and directories to get name like 'button'
        const fileBase = path.basename(relativeFilePath, path.extname(relativeFilePath));
        const escapedBase = fileBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const importPattern = new RegExp(
            `from\\s+["'].*\\/${escapedBase}["']|import\\s+["'].*\\/${escapedBase}["']`,
            "i"
        );

        const walk = async (dir: string): Promise<void> => {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!RISK_SCAN_SKIP_DIRS.has(entry.name)) {
                        await walk(fullPath);
                    }
                } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
                    // Do not count the file itself
                    if (fullPath.includes(relativeFilePath)) continue;
                    const content = await fs.promises.readFile(fullPath, "utf8");
                    if (importPattern.test(content)) {
                        count++;
                    }
                }
            }
        };

        if (fs.existsSync(projectPath)) {
            await walk(projectPath);
        }
    } catch (e) {
        console.error("Failed to scan fan out:", e);
    }

    let tier: RiskTier = "GREEN";
    if (count > 30) tier = "RED";
    else if (count >= 5) tier = "ORANGE";
    else if (count >= 1) tier = "YELLOW";

    return { tier, count };
}

// Safety-net checklist required for a given risk tier. Shared by the task-create
// route and the live risk-tier preview so the modal shows exactly what will apply.
export function getSafetyNets(tier: RiskTier): string[] {
    switch (tier) {
        case "RED":
            return [
                "Unit tests covering all edge cases",
                "Snapshot assertions for all usages",
                "Visual regression tests (Playwright)",
                "CI Guard validation run",
            ];
        case "ORANGE":
            return [
                "Unit tests for basic flows",
                "Snapshot assertions for all visual variants",
            ];
        case "YELLOW":
            return [
                "Standard unit tests",
                "Manual visual verification of 2-3 key states",
            ];
        default:
            return ["Basic unit test verification"];
    }
}

// A command (npm/npx/git) may itself fork children (vitest, next dev, …), so
// killing proc.pid alone can leave them running. Spawning detached puts the
// command and its children in their own process group, which can then be killed
// as a unit via the negative-pid form.
function killProcessTree(proc: ChildProcess): void {
    if (proc.pid) {
        try {
            process.kill(-proc.pid, "SIGTERM");
            return;
        } catch {
            // Group already gone — fall through to a plain kill just in case.
        }
    }
    proc.kill();
}

/** Stop a running command (dev server, build, …) tracked under `processKey`,
 *  killing its whole process group. Returns true when a live process was found
 *  and signalled, false when nothing was tracked (already stopped, or started
 *  before an app restart that cleared the in-memory registry). */
export function stopProjectCommand(processKey: string): boolean {
    const proc = ACTIVE_PROCESSES.get(processKey);
    if (!proc) return false;
    killProcessTree(proc);
    ACTIVE_PROCESSES.delete(processKey);
    return true;
}

// Process Runner
export function runProjectCommand(
    taskId: string,
    projectPath: string,
    command: string,
    args: string[],
    onData: (data: string) => void,
    extraEnv?: Record<string, string>
): Promise<number> {
    return new Promise((resolve) => {
        // Kill existing process (and its whole tree) for task if any
        const existing = ACTIVE_PROCESSES.get(taskId);
        if (existing) {
            killProcessTree(existing);
        }

        // The parent (Next.js dev server) runs with NODE_ENV=development. If we let
        // spawned commands inherit it, `next build` builds in dev mode and fails while
        // prerendering /_global-error ("Cannot read properties of null (reading 'useContext')").
        // Strip NODE_ENV so each command sets its own correct mode (build→production,
        // dev→development), matching a clean terminal run.
        const childEnv = { ...process.env, ...extraEnv };
        delete (childEnv as Record<string, string | undefined>).NODE_ENV;

        // shell:false — the command (npm/npx/git/…) is executed directly via PATH
        // lookup with args passed as a discrete argv, so a value that ever reaches
        // `args` can never be interpreted as shell syntax (command injection).
        // Node resolves the bare binary against PATH without a shell here; the other
        // spawners in this codebase (bridge worker, git service) run the same way.
        // detached: own process group, so killProcessTree can take out the whole tree.
        const proc = spawn(command, args, { cwd: projectPath, shell: false, env: childEnv, detached: true });
        ACTIVE_PROCESSES.set(taskId, proc);

        const handleData = (chunk: Buffer) => {
            const str = chunk.toString();
            onData(str);
            notifyLogListeners(taskId, str);
        };

        proc.stdout.on("data", handleData);
        proc.stderr.on("data", handleData);

        proc.on("error", (err) => {
            ACTIVE_PROCESSES.delete(taskId);
            onData(`\n[Error] Failed to run command: ${err.message}\n`);
            resolve(1);
        });

        proc.on("close", (code) => {
            ACTIVE_PROCESSES.delete(taskId);
            resolve(code ?? 0);
        });
    });
}

// Log stream fan-out (LOG_LISTENERS, subscribeToLogs, notifyLogListeners,
// publishTaskLog) lives in ./loop-logs.service and is re-exported below.

// Verifier/build guards + the <file_edit> applier (classifyProtectedPath,
// applyFileEdits, ApplyFileEditsOptions, FileEditResult) live in
// ./loop-file-guards and are re-exported below.

// Re-exports: git and bridge helpers were split into their own service files
// (300-line rule); existing importers keep working through this module.
export * from "./loop-git.service";
export * from "./loop-bridge.service";
export * from "./loop-logs.service";
export * from "./loop-file-guards";
