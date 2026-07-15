import { NextResponse } from "next/server";
import { getProjects, saveProjects, writeBridgeRequest } from "@/core/services/loop-projects.service";
import { resolveLoopLlm } from "@/core/services/loop-llm.service";
import { runCollaborationLoop } from "@/core/services/loop-collaboration.service";
import { autoFulfillBridge } from "@/core/services/loop-bridge-worker.service";

// POST /api/loop-projects/[projectId]/tasks/[taskId]/collaborate
// Kick off the AI-team pipeline (Architect → Developer → QA → DevOps → Auditor)
// for one task in the background. The pipeline itself lives in
// loop-collaboration.service.ts, shared with the Auto-Run orchestrator.
export async function POST(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const body = await req.json();
        const { instructions } = body;

        const forceBridge = body.bridge === true;
        const userKey = req.headers.get("x-anthropic-api-key") || body.apiKey;
        const llm = forceBridge ? null : resolveLoopLlm(userKey);
        if (!llm) {
            const bridgeId = writeBridgeRequest({ taskId, projectId, requestType: "collaborate", prompt: instructions });
            // Opt-in (LOOP_BRIDGE_AUTO): auto-fulfill with a local agent. Fire-and-forget.
            void autoFulfillBridge(taskId, bridgeId).catch(() => { /* worker logs its own errors */ });
            return NextResponse.json({
                success: true,
                bridged: true,
                bridgeId,
                message: "Collaborate bridged to IDE Agent."
            });
        }

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        const task = project?.tasks?.find((t) => t.id === taskId);

        if (!project || !task) {
            return NextResponse.json({ success: false, error: "Project or Task not found" }, { status: 404 });
        }

        // Set status to running
        task.status = "running";
        task.updatedAt = new Date().toISOString();
        saveProjects(projects);

        // Run the agent collaboration loop in the background against the
        // selected project directory (NOT the host app), matching chat/action routes.
        void runCollaborationLoop(projectId, taskId, project.path, llm, instructions);

        return NextResponse.json({ success: true, message: "AI Team collaboration started in background." });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
