import fs from "fs";
import path from "path";
import { writeJsonStore } from "./json-store";

// IDE Agent Bridge — a free, key-less path: instead of calling a paid LLM, the
// request is written to .antigravity/bridge-<taskId>.json for an IDE coding agent
// (Antigravity/Cursor/Claude Code) to fulfill. The agent writes its reply back
// into the same file; the app polls, applies any <file_edit> blocks, and shows
// the reply in chat. See AGENTS.md "Loop Studio IDE Bridge" for the protocol.
// Split out of loop-projects.service.ts (300-line rule); that module re-exports
// everything here.
//
// One file PER TASK so several tasks can be bridged/auto-fulfilled concurrently
// (an auto-run backlog, say) without clobbering a single shared slot.

// Task ids are controlled (`task-<ts>-<n>`), but sanitize defensively so a
// crafted id can never escape the .antigravity dir.
function bridgeFilePath(taskId: string): string {
    const safe = String(taskId).replace(/[^A-Za-z0-9._-]/g, "_");
    return path.join(process.cwd(), ".antigravity", `bridge-${safe}.json`);
}

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

/** Write a pending bridge request to .antigravity/bridge-<taskId>.json. Returns the request id. */
export function writeBridgeRequest(input: {
    taskId: string;
    projectId: string;
    requestType: "chat" | "collaborate";
    prompt: string;
    history?: unknown[];
}): string {
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
    // Atomic write: the IDE agent on the other side may read this file at any moment.
    writeJsonStore(bridgeFilePath(input.taskId), payload);
    return id;
}

/** All bridge requests currently on disk (one per task). Used to surface pending
 *  requests to an external fulfiller (e.g. the MCP server's list_pending_bridges). */
export function listBridgeRequests(): BridgeRequest[] {
    const dir = path.join(process.cwd(), ".antigravity");
    try {
        return fs.readdirSync(dir)
            .filter((f) => /^bridge-.+\.json$/.test(f))
            .map((f) => {
                try {
                    return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as BridgeRequest;
                } catch {
                    return null;
                }
            })
            .filter((b): b is BridgeRequest => b !== null);
    } catch {
        return [];
    }
}

/** Read the current bridge request for a task (or null if none/unreadable). */
export function readBridgeRequest(taskId: string): BridgeRequest | null {
    try {
        const file = bridgeFilePath(taskId);
        if (!fs.existsSync(file)) return null;
        return JSON.parse(fs.readFileSync(file, "utf8")) as BridgeRequest;
    } catch {
        return null;
    }
}

/**
 * Write an agent's reply back into a task's bridge request (id-guarded). Used by
 * the auto-fulfill worker to finalize a request the same way a human running
 * `run bridge` would: set `status` to "done" with a `response`, or "error".
 * A no-op if the current bridge id no longer matches (a newer request replaced
 * it), so a slow worker can't clobber a fresh request.
 */
export function writeBridgeResponse(
    taskId: string,
    id: string,
    result: { status: "done" | "error"; response?: string; error?: string }
): void {
    const current = readBridgeRequest(taskId);
    if (!current || current.id !== id) return;
    current.status = result.status;
    if (result.response !== undefined) current.response = result.response;
    if (result.error !== undefined) current.error = result.error;
    current.updatedAt = new Date().toISOString();
    writeJsonStore(bridgeFilePath(taskId), current);
}

/** Mark a task's bridge request consumed so it is not applied twice. */
export function markBridgeConsumed(taskId: string, id: string): void {
    const current = readBridgeRequest(taskId);
    if (!current || current.id !== id) return;
    current.status = "consumed";
    current.updatedAt = new Date().toISOString();
    // Throws on failure: silently failing here would let the same bridge
    // response (and its file edits) be applied twice.
    writeJsonStore(bridgeFilePath(taskId), current);
}
