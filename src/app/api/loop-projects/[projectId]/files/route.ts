import { NextResponse } from "next/server";
import { getProjects, listProjectFiles } from "@/core/services/loop-projects.service";
import path from "path";
import fs from "fs";

// Lists editable source files in the project, or reads a single file when ?file=... is provided.
export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const { searchParams } = new URL(req.url);
        const fileParam = searchParams.get("file");

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        if (fileParam) {
            // Resolve and verify traversal bounds
            const resolvedPath = path.resolve(project.path, fileParam);
            if (!resolvedPath.startsWith(path.resolve(project.path))) {
                return NextResponse.json({ success: false, error: "Access denied: outside project bounds" }, { status: 403 });
            }

            if (!fs.existsSync(resolvedPath)) {
                return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
            }

            const content = await fs.promises.readFile(resolvedPath, "utf8");
            return NextResponse.json({ success: true, data: content });
        }

        const files = await listProjectFiles(project.path);
        return NextResponse.json({ success: true, data: files });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
