import { NextResponse } from "next/server";
import { getProjects, listProjectFiles } from "@/core/services/loop-projects.service";

// Lists editable source files in the project so the Create Task modal can offer
// a searchable file picker instead of requiring hand-typed relative paths.
export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const files = await listProjectFiles(project.path);
        return NextResponse.json({ success: true, data: files });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
