import fs from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import type { LoopProject, RiskTier } from "@/core/interfaces/loop-projects.interface";

const PROJECTS_FILE_PATH = path.join(process.cwd(), ".antigravity", "loop-projects.json");

// In-memory registry of running child processes
export const ACTIVE_PROCESSES = new Map<string, ChildProcess>();
// In-memory stream listeners for logs
const LOG_LISTENERS = new Map<string, ((data: string) => void)[]>();

function ensureDirExists() {
    const dir = path.dirname(PROJECTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// A fresh store starts empty — projects are registered/bootstrapped by the user.
// (The old "App Store (Host)" seed was leftover from the removed App Store repo.)
const DEFAULT_PROJECTS: LoopProject[] = [];

export function getProjects(): LoopProject[] {
    try {
        ensureDirExists();
        if (!fs.existsSync(PROJECTS_FILE_PATH)) {
            fs.writeFileSync(PROJECTS_FILE_PATH, JSON.stringify(DEFAULT_PROJECTS, null, 2), "utf8");
            return DEFAULT_PROJECTS;
        }
        const data = fs.readFileSync(PROJECTS_FILE_PATH, "utf8");
        return JSON.parse(data) as LoopProject[];
    } catch {
        return DEFAULT_PROJECTS;
    }
}

export function saveProjects(projects: LoopProject[]): void {
    try {
        ensureDirExists();
        fs.writeFileSync(PROJECTS_FILE_PATH, JSON.stringify(projects, null, 2), "utf8");
    } catch (err) {
        console.error("Failed to save projects:", err);
    }
}

// Trace fan-out (import references) of a file to determine Risk Tier
export function calculateRiskTier(projectPath: string, relativeFilePath: string): { tier: RiskTier; count: number } {
    let count = 0;
    try {
        const fileBase = path.basename(relativeFilePath, path.extname(relativeFilePath));
        // Remove extension and directories to get name like 'button'
        const importPattern = new RegExp(`from\\s+["'].*\\/${fileBase}["']|import\\s+["'].*\\/${fileBase}["']`, "i");

        const walk = (dir: string) => {
            const list = fs.readdirSync(dir);
            for (const file of list) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    if (file !== "node_modules" && file !== ".next" && file !== ".git" && file !== "dist") {
                        walk(fullPath);
                    }
                } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
                    // Do not count the file itself
                    if (fullPath.includes(relativeFilePath)) continue;
                    const content = fs.readFileSync(fullPath, "utf8");
                    if (importPattern.test(content)) {
                        count++;
                    }
                }
            }
        };

        if (fs.existsSync(projectPath)) {
            walk(projectPath);
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

// Process Runner
export function runProjectCommand(
    taskId: string,
    projectPath: string,
    command: string,
    args: string[],
    onData: (data: string) => void
): Promise<number> {
    return new Promise((resolve) => {
        // Kill existing process for task if any
        const existing = ACTIVE_PROCESSES.get(taskId);
        if (existing) {
            existing.kill();
        }

        // The parent (Next.js dev server) runs with NODE_ENV=development. If we let
        // spawned commands inherit it, `next build` builds in dev mode and fails while
        // prerendering /_global-error ("Cannot read properties of null (reading 'useContext')").
        // Strip NODE_ENV so each command sets its own correct mode (build→production,
        // dev→development), matching a clean terminal run.
        const childEnv = { ...process.env };
        delete (childEnv as Record<string, string | undefined>).NODE_ENV;

        const proc = spawn(command, args, { cwd: projectPath, shell: true, env: childEnv });
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

// File Edits Parser for Claude Chat Responses
export function applyFileEdits(projectPath: string, content: string): string[] {
    const fileRegex = /<file_edit\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file_edit>/g;
    let match;
    const modifiedFiles: string[] = [];

    while ((match = fileRegex.exec(content)) !== null) {
        const relativePath = match[1];
        const fileContent = match[2];
        const fullPath = path.join(projectPath, relativePath);

        try {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, fileContent, "utf8");
            modifiedFiles.push(relativePath);
        } catch (e) {
            console.error(`Failed to write file ${relativePath}:`, e);
        }
    }

    return modifiedFiles;
}

// Re-exports: git and bridge helpers were split into their own service files
// (300-line rule); existing importers keep working through this module.
export * from "./loop-git.service";
export * from "./loop-bridge.service";
