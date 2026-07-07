import { NextResponse } from "next/server";
import { getProjects, executeGitCommand } from "@/core/services/loop-projects.service";

export async function GET(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const task = project.tasks?.find((t) => t.id === taskId);
        if (!task) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        // Run git diff on target files or the whole project if empty
        const diffArgs = ["diff"];
        if (task.targetFiles && task.targetFiles.length > 0) {
            diffArgs.push("--");
            diffArgs.push(...task.targetFiles);
        }

        const diff = await executeGitCommand(project.path, diffArgs).catch((e) => {
            return `No git diff available: ${e.message}`;
        });

        return NextResponse.json({ success: true, data: diff });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
