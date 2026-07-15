import { NextResponse } from "next/server";
import { readBridgeRequest } from "@/core/services/loop-projects.service";
import { finalizeBridgeReply } from "@/core/services/loop-bridge-apply.service";

// Poll the IDE bridge for this task. The client calls this repeatedly after a
// request was bridged; when the IDE agent has written status "done"/"error",
// the client then POSTs to finalize it.
export async function GET(req: Request, context: { params: Promise<{ projectId: string; taskId: string }> }) {
    try {
        const { taskId } = await context.params;
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        const bridge = readBridgeRequest(taskId);
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
// bridge consumed (idempotent — a second call is a no-op). The shared
// finalizeBridgeReply helper is also used by the MCP submit_bridge_reply tool.
export async function POST(req: Request, context: { params: Promise<{ projectId: string; taskId: string }> }) {
    try {
        const { projectId, taskId } = await context.params;
        const { id } = await req.json();

        const result = finalizeBridgeReply(projectId, taskId, id);
        if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        }
        if (result.alreadyConsumed) {
            return NextResponse.json({ success: true, alreadyConsumed: true });
        }
        return NextResponse.json({ success: true, data: result.message, editedFiles: result.editedFiles });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
