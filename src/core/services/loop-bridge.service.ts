import fs from "fs";
import path from "path";

// IDE Agent Bridge — a free, key-less path: instead of calling a paid LLM, the
// request is written to .antigravity/bridge.json for an IDE coding agent
// (Antigravity/Cursor/Claude Code) to fulfill. The agent writes its reply back
// into the same file; the app polls, applies any <file_edit> blocks, and shows
// the reply in chat. See AGENTS.md "Loop Studio IDE Bridge" for the protocol.
// Split out of loop-projects.service.ts (300-line rule); that module re-exports
// everything here.

const BRIDGE_FILE_PATH = path.join(process.cwd(), ".antigravity", "bridge.json");

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
    "You are an IDE coding agent fulfilling a Loop Studio request. Read `prompt` " +
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
    const dir = path.dirname(BRIDGE_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
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
