import { NextResponse } from "next/server";
import { getProjects } from "@/core/services/loop-projects.service";
import { getKnowledgeEntries } from "@/core/services/loop-knowledge.service";

// GET /api/loop-projects/[projectId]/knowledge
// Accumulated learnings for a project (fed into planner/collaboration prompts).
export async function GET(
    req: Request,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await context.params;
        const project = getProjects().find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: { entries: getKnowledgeEntries(projectId) } });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
