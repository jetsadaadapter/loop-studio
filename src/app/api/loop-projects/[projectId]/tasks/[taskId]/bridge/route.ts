import { NextResponse } from "next/server";
import {
    getProjects,
    saveProjects,
    applyFileEdits,
    readBridgeRequest,
    markBridgeConsumed,
} from "@/core/services/loop-projects.service";
import type { ChatMessage } from "@/core/interfaces/loop-projects.interface";
import fs from "fs";
import path from "path";

// Poll the IDE bridge for this task. The client calls this repeatedly after a
// request was bridged; when the IDE agent has written status "done"/"error",
// the client then POSTs to finalize it.
export async function GET(req: Request, context: { params: Promise<{ projectId: string; taskId: string }> }) {
    try {
        const { taskId } = await context.params;
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        const bridge = readBridgeRequest();
        if (!bridge || bridge.taskId !== taskId || (id && bridge.id !== id)) {
            return NextResponse.json({ status: "none" });
        }
        return NextResponse.json({
            status: bridge.status,
            response: bridge.response ?? null,
            error: bridge.error ?? null,
            id: bridge.id,
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

// Finalize a completed bridge request: apply any <file_edit> blocks from the
// IDE agent's reply, record the assistant message on the task, and mark the
// bridge consumed (idempotent — a second call is a no-op).
export async function POST(req: Request, context: { params: Promise<{ projectId: string; taskId: string }> }) {
    try {
        const { projectId, taskId } = await context.params;
        const { id } = await req.json();

        const bridge = readBridgeRequest();
        if (!bridge || bridge.id !== id || bridge.taskId !== taskId) {
            return NextResponse.json({ success: false, error: "Bridge request not found" }, { status: 404 });
        }
        if (bridge.status === "consumed") {
            return NextResponse.json({ success: true, alreadyConsumed: true });
        }
        if (bridge.status !== "done") {
            return NextResponse.json({ success: false, error: `Bridge status is "${bridge.status}"` }, { status: 409 });
        }

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        const task = project?.tasks?.find((t) => t.id === taskId);
        if (!project || !task) {
            return NextResponse.json({ success: false, error: "Project or Task not found" }, { status: 404 });
        }

        const responseText = bridge.response || "";
        // Apply edits only if the agent returned <file_edit> blocks (no-op otherwise).
        // Bridge replies are human-reviewed in chat, so test files are allowed;
        // verifier/build config stays protected.
        const { written: editedFiles, blocked } = applyFileEdits(project.path, responseText, { allowTestFiles: true });

        const agentMsg: ChatMessage = {
            id: `msg-bridge-${Date.now()}`,
            role: "assistant",
            senderName: "Somsri (via IDE Bridge)",
            content: responseText,
            timestamp: new Date().toISOString(),
            tokensUsed: { input: 0, output: 0, cost: 0 }, // free path — no API tokens
        };
        task.chatHistory.push(agentMsg);
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
            fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
            if (editedFiles.length > 0) {
                fs.appendFileSync(logFilePath, `[Bridge] IDE agent modified: ${editedFiles.join(", ")}\n`);
            }
            if (blocked.length > 0) {
                fs.appendFileSync(logFilePath, blocked.map((b) => `[Bridge] BLOCKED ${b.path} — ${b.reason}\n`).join(""));
            }
        }

        markBridgeConsumed(id);
        return NextResponse.json({ success: true, data: agentMsg, editedFiles });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
