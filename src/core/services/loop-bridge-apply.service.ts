import fs from "fs";
import path from "path";
import { getProjects, saveProjects, applyFileEdits } from "./loop-projects.service";
import { readBridgeRequest, writeBridgeResponse, markBridgeConsumed } from "./loop-bridge.service";
import type { ChatMessage } from "@/core/interfaces/loop-projects.interface";

// Finalize a bridged reply: apply its <file_edit> blocks through the GUARDED
// applyFileEdits (config lock + test-file policy), record the assistant message +
// activity on the task, and mark the bridge consumed. Shared by the bridge HTTP
// route (POST — the human/worker already wrote the reply into the file) and the
// MCP server's submit_bridge_reply tool (which passes the reply in `opts.reply`).

interface FinalizeOpts {
    /** When given, write this reply into the bridge (status "done") before applying.
     *  Used by headless fulfillers (MCP) that supply the reply directly. */
    reply?: string;
    /** Sender label for the recorded assistant message. */
    senderName?: string;
}

type FinalizeResult =
    | { ok: true; alreadyConsumed?: boolean; message?: ChatMessage; editedFiles: string[]; blocked: { path: string; reason: string }[] }
    | { ok: false; status: number; error: string };

export function finalizeBridgeReply(
    projectId: string,
    taskId: string,
    id: string,
    opts: FinalizeOpts = {},
): FinalizeResult {
    if (opts.reply !== undefined) {
        writeBridgeResponse(taskId, id, { status: "done", response: opts.reply });
    }

    const bridge = readBridgeRequest(taskId);
    if (!bridge || bridge.id !== id || bridge.taskId !== taskId) {
        return { ok: false, status: 404, error: "Bridge request not found" };
    }
    if (bridge.status === "consumed") {
        return { ok: true, alreadyConsumed: true, editedFiles: [], blocked: [] };
    }
    if (bridge.status !== "done") {
        return { ok: false, status: 409, error: `Bridge status is "${bridge.status}"` };
    }

    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks?.find((t) => t.id === taskId);
    if (!project || !task) {
        return { ok: false, status: 404, error: "Project or Task not found" };
    }

    const responseText = bridge.response || "";
    // Apply edits only if the reply returned <file_edit> blocks (no-op otherwise).
    // Bridge replies are reviewed in chat, so test files are allowed; verifier/build
    // config stays protected.
    const { written: editedFiles, blocked } = applyFileEdits(project.path, responseText, { allowTestFiles: true, allowedPaths: task.targetFiles });

    const message: ChatMessage = {
        id: `msg-bridge-${Date.now()}`,
        role: "assistant",
        senderName: opts.senderName || "Somsri (via IDE Bridge)",
        content: responseText,
        timestamp: new Date().toISOString(),
        tokensUsed: { input: 0, output: 0, cost: 0 }, // free path — no API tokens
    };
    task.chatHistory.push(message);
    task.activities.push({
        id: `act-bridge-${Date.now()}`,
        taskId,
        stage: "BUILD",
        action: "bridge_reply",
        message: editedFiles.length > 0 ? `IDE bridge modified: ${editedFiles.join(", ")}` : "IDE bridge replied",
        timestamp: new Date().toISOString(),
    });
    task.updatedAt = new Date().toISOString();
    saveProjects(projects);

    if (editedFiles.length > 0 || blocked.length > 0) {
        const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);
        try {
            fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
            if (editedFiles.length > 0) {
                fs.appendFileSync(logFilePath, `[Bridge] IDE agent modified: ${editedFiles.join(", ")}\n`);
            }
            if (blocked.length > 0) {
                fs.appendFileSync(logFilePath, blocked.map((b) => `[Bridge] BLOCKED ${b.path} — ${b.reason}\n`).join(""));
            }
        } catch {
            /* best-effort log */
        }
    }

    markBridgeConsumed(taskId, id);
    return { ok: true, message, editedFiles, blocked };
}
