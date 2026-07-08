import fs from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import type { LoopProject, RiskTier } from "@/core/interfaces/loop-projects.interface";
import { readJsonStore, writeJsonStore } from "./json-store";

const PROJECTS_FILE_PATH = path.join(process.cwd(), ".antigravity", "loop-projects.json");

// In-memory registry of running child processes
export const ACTIVE_PROCESSES = new Map<string, ChildProcess>();
// In-memory stream listeners for logs
const LOG_LISTENERS = new Map<string, ((data: string) => void)[]>();

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
 * True when the registered project IS this running app's own repo. Guarded
 * operations (next build, auto-commit, dev server) are blocked for it: they
 * would overwrite the live .next output, sweep unrelated work into commits,
 * or fight over the port the app is serving on.
 */
export function isHostProject(projectPath: string): boolean {
    return path.resolve(projectPath) === process.cwd();
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

// Commands run through a shell (shell: true), so proc.pid is the shell — killing
// it alone leaves the actual command (vitest, next dev, …) running. Spawning
// detached puts the shell and its children in their own process group, which
// can then be killed as a unit via the negative-pid form.
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

// Process Runner
export function runProjectCommand(
    taskId: string,
    projectPath: string,
    command: string,
    args: string[],
    onData: (data: string) => void
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
        const childEnv = { ...process.env };
        delete (childEnv as Record<string, string | undefined>).NODE_ENV;

        // detached: own process group, so killProcessTree can take out shell + children
        const proc = spawn(command, args, { cwd: projectPath, shell: true, env: childEnv, detached: true });
        ACTIVE_PROCESSES.set(taskId, proc);

        const handleData = (chunk: Buffer) => {
            const str = chunk.toString();
            onData(str);
            const listeners = LOG_LISTENERS.get(taskId) || [];
            listeners.forEach((l) => l(str));
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

// Verifier/build configuration — these files ARE the gate (they decide what
// "passing" means). No AI role may rewrite them: an agent that can edit the
// test runner config or package scripts can make the check trivially pass.
const CONFIG_FILE_PATTERNS: RegExp[] = [
    /^package\.json$/,
    /^tsconfig(\..+)?\.json$/,
    /^(vitest|vite|playwright|jest|eslint)\.config\.[cm]?[jt]s$/,
    /^\.eslintrc(\..+)?$/,
];

/**
 * Classify a repo-relative path as part of the verifier surface:
 * - "config": the gate's configuration (test/build/CI). Off-limits to every AI role.
 * - "test":   test/spec/snapshot sources. Off-limits to the implementer, written only by QA.
 * - null:     ordinary source the implementer may edit freely.
 */
export function classifyProtectedPath(relativePath: string): "config" | "test" | null {
    const normalized = relativePath.replace(/\\/g, "/");
    const segments = normalized.split("/").filter(Boolean);
    const base = segments[segments.length - 1] ?? "";

    if (CONFIG_FILE_PATTERNS.some((re) => re.test(base))) return "config";
    if (normalized.includes(".github/workflows/")) return "config";

    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(base)) return "test";
    if (base.endsWith(".snap")) return "test";
    if (segments.some((s) => s === "__tests__" || s === "__snapshots__")) return "test";

    return null;
}

export interface ApplyFileEditsOptions {
    /**
     * Allow writing test/spec/snapshot files. Set by the QA role (whose job is
     * to author tests) and by human-in-the-loop paths (interactive chat, bridge).
     * Verifier *configuration* stays blocked regardless of this flag.
     */
    allowTestFiles?: boolean;
}

export interface FileEditResult {
    /** Repo-relative paths actually written. */
    written: string[];
    /** Edits refused, with the reason (traversal or protected verifier file). */
    blocked: { path: string; reason: string }[];
}

// File Edits Parser for Claude Chat Responses.
// Defaults to the strict implementer policy (no test files, no config) so an
// unaudited caller can never silently edit the gate.
export function applyFileEdits(
    projectPath: string,
    content: string,
    options: ApplyFileEditsOptions = {},
): FileEditResult {
    const fileRegex = /<file_edit\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file_edit>/g;
    let match;
    const written: string[] = [];
    const blocked: { path: string; reason: string }[] = [];
    const projectRoot = path.resolve(projectPath);

    while ((match = fileRegex.exec(content)) !== null) {
        const relativePath = match[1];
        const fileContent = match[2];
        const fullPath = path.resolve(projectRoot, relativePath);

        // The path comes from LLM/bridge output — never let it escape the
        // registered project directory (e.g. via "../" or an absolute path).
        if (!fullPath.startsWith(projectRoot + path.sep)) {
            blocked.push({ path: relativePath, reason: "resolves outside the project root" });
            console.error(`Refused file edit outside project root: ${relativePath}`);
            continue;
        }

        const kind = classifyProtectedPath(relativePath);
        if (kind === "config") {
            blocked.push({ path: relativePath, reason: "verifier/build configuration is protected from AI edits" });
            continue;
        }
        if (kind === "test" && !options.allowTestFiles) {
            blocked.push({ path: relativePath, reason: "test files are protected from the implementer (only QA may write them)" });
            continue;
        }

        try {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, fileContent, "utf8");
            written.push(relativePath);
        } catch (e) {
            blocked.push({ path: relativePath, reason: e instanceof Error ? e.message : String(e) });
            console.error(`Failed to write file ${relativePath}:`, e);
        }
    }

    return { written, blocked };
}

// Re-exports: git and bridge helpers were split into their own service files
// (300-line rule); existing importers keep working through this module.
export * from "./loop-git.service";
export * from "./loop-bridge.service";
