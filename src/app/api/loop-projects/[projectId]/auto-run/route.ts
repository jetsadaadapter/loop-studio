import { NextResponse } from "next/server";
import { getProjects } from "@/core/services/loop-projects.service";
import { resolveLoopLlm } from "@/core/services/loop-llm.service";
import { startAutoRun, getAutoRunStatus, requestAutoRunStop } from "@/core/services/loop-autorun.service";

// Auto-Run orchestrator endpoints.
// POST   → start draining the backlog ({ taskIds? } to limit scope)
// GET    → current run state (progress polling)
// DELETE → request a graceful stop after the current task

export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const body = await req.json().catch(() => ({}));
        const taskIds: string[] | undefined = Array.isArray(body.taskIds) ? body.taskIds : undefined;

        const project = getProjects().find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        // The orchestrator makes many sequential LLM calls, so a synchronous
        // key is required — the IDE bridge (async, single-slot) cannot drive it.
        const userKey = req.headers.get("x-anthropic-api-key") || body.apiKey;
        const llm = resolveLoopLlm(userKey);
        if (!llm) {
            return NextResponse.json(
                { success: false, error: "Auto-run requires an API key (set one on the AI Team page)." },
                { status: 400 },
            );
        }

        const result = startAutoRun(projectId, llm, taskIds);
        if (!result.started) {
            return NextResponse.json({ success: false, error: result.error }, { status: 409 });
        }
        return NextResponse.json({ success: true, data: { total: result.total } });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await context.params;
    return NextResponse.json({ success: true, data: getAutoRunStatus(projectId) });
}

export async function DELETE(req: Request, context: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await context.params;
    const stopped = requestAutoRunStop(projectId);
    return NextResponse.json({ success: true, data: { stopping: stopped } });
}
