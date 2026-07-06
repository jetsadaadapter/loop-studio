import { NextResponse } from "next/server";
import { getProjects, getRecentCommits } from "@/core/services/loop-projects.service";

// Recent commits (version history) for the Studio version timeline.
export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }
        const commits = await getRecentCommits(project.path);
        return NextResponse.json({ success: true, data: commits });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
