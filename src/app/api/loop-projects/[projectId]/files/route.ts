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

        const projectsDir = path.join(process.cwd(), ".projects");

        if (fileParam) {
            // Resolve and verify traversal bounds.
            // If fileParam is relative to .projects/ (e.g. crm-thai-oil/src/app/page.tsx), 
            // we should try to resolve it from the .projects folder as well.
            let resolvedPath = path.resolve(project.path, fileParam);
            
            // If it doesn't exist, try resolving relative to .projects/
            if (!fs.existsSync(resolvedPath)) {
                const altPath = path.resolve(projectsDir, fileParam);
                if (altPath.startsWith(projectsDir + path.sep)) {
                    resolvedPath = altPath;
                }
            }

            if (!resolvedPath.startsWith(path.resolve(project.path)) && !resolvedPath.startsWith(projectsDir + path.sep)) {
                return NextResponse.json({ success: false, error: "Access denied: outside project bounds" }, { status: 403 });
            }

            if (!fs.existsSync(resolvedPath)) {
                return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
            }

            const content = await fs.promises.readFile(resolvedPath, "utf8");
            return NextResponse.json({ success: true, data: content });
        }

        const files = await listProjectFiles(project.path);
        const mappedFiles = files.map((file) => {
            const absoluteFilePath = path.resolve(project.path, file);
            if (absoluteFilePath.startsWith(projectsDir + path.sep)) {
                return path.relative(projectsDir, absoluteFilePath);
            }
            return file;
        });

        return NextResponse.json({ success: true, data: mappedFiles });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
