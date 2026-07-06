import fs from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import type { LoopProject, RiskTier } from "@/core/interfaces/loop-projects.interface";

const PROJECTS_FILE_PATH = path.join(process.cwd(), ".antigravity", "loop-projects.json");
const BRIDGE_FILE_PATH = path.join(process.cwd(), ".antigravity", "bridge.json");

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

const DEFAULT_PROJECTS: LoopProject[] = [
    {
        id: "app-store-default",
        name: "App Store (Host)",
        path: process.cwd(),
        template: "nextjs-app",
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

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

// ─────────────────────────────────────────────────────────────────────────────
// IDE Agent Bridge
// A free, key-less path: instead of calling a paid LLM, the request is written to
// .antigravity/bridge.json for an IDE coding agent (Antigravity/Cursor/Claude Code)
// to fulfill. The agent writes its reply back into the same file; the app polls,
// applies any <file_edit> blocks, and shows the reply in chat. See AGENTS.md
// "Loop DevStudio IDE Bridge" for the protocol the IDE agent must follow.
// ─────────────────────────────────────────────────────────────────────────────

export type BridgeStatus = "pending" | "done" | "error" | "consumed";

export interface BridgeRequest {
    status: BridgeStatus;
    id: string;
    taskId: string;
    projectId: string;
    requestType: "chat" | "collaborate";
    prompt: string;
    history?: unknown[];
    instructions: string;
    response?: string;
    error?: string;
    updatedAt: string;
}

const BRIDGE_INSTRUCTIONS =
    "You are an IDE coding agent fulfilling a Loop DevStudio request. Read `prompt` " +
    "(and `history` for context), make the changes in this repository, then write your " +
    "reply into the `response` field of this file and set `status` to \"done\" (or " +
    "\"error\" with an `error` message). To have the app render/apply code, include full " +
    "file bodies as <file_edit path=\"relative/path\">...</file_edit> blocks inside `response`.";

/** Write a pending bridge request to .antigravity/bridge.json. Returns the request id. */
export function writeBridgeRequest(input: {
    taskId: string;
    projectId: string;
    requestType: "chat" | "collaborate";
    prompt: string;
    history?: unknown[];
}): string {
    ensureDirExists();
    const id = `bridge-${Date.now()}`;
    const payload: BridgeRequest = {
        status: "pending",
        id,
        taskId: input.taskId,
        projectId: input.projectId,
        requestType: input.requestType,
        prompt: input.prompt,
        history: input.history ?? [],
        instructions: BRIDGE_INSTRUCTIONS,
        updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(BRIDGE_FILE_PATH, JSON.stringify(payload, null, 2), "utf8");
    return id;
}

/** Read the current bridge request (or null if none/unreadable). */
export function readBridgeRequest(): BridgeRequest | null {
    try {
        if (!fs.existsSync(BRIDGE_FILE_PATH)) return null;
        return JSON.parse(fs.readFileSync(BRIDGE_FILE_PATH, "utf8")) as BridgeRequest;
    } catch {
        return null;
    }
}

/** Mark the bridge request consumed so it is not applied twice. */
export function markBridgeConsumed(id: string): void {
    const current = readBridgeRequest();
    if (!current || current.id !== id) return;
    current.status = "consumed";
    current.updatedAt = new Date().toISOString();
    try {
        fs.writeFileSync(BRIDGE_FILE_PATH, JSON.stringify(current, null, 2), "utf8");
    } catch (e) {
        console.error("Failed to mark bridge consumed:", e);
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

// Git Helpers
export async function executeGitCommand(projectPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn("git", args, { cwd: projectPath });
        let out = "";
        proc.stdout.on("data", (d) => { out += d.toString(); });
        proc.stderr.on("data", (d) => { out += d.toString(); });
        proc.on("close", (code) => {
            if (code === 0) resolve(out.trim());
            else reject(new Error(out.trim() || `Git exited with code ${code}`));
        });
    });
}

export async function getGitInfo(projectPath: string) {
    try {
        const branch = await executeGitCommand(projectPath, ["branch", "--show-current"]).catch(() => "unknown");
        const commit = await executeGitCommand(projectPath, ["rev-parse", "--short", "HEAD"]).catch(() => "none");
        const status = await executeGitCommand(projectPath, ["status", "--porcelain"]).catch(() => "");
        const modifiedFiles = status.split("\n").filter(Boolean).map(line => line.trim());
        return { branch, commit, modifiedFiles };
    } catch {
        return { branch: "unknown", commit: "none", modifiedFiles: [] };
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
