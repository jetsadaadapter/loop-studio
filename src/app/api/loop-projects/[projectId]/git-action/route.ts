import { NextResponse } from "next/server";
import { getProjects, executeGitCommand, getGitInfo } from "@/core/services/loop-projects.service";

export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const body = await req.json();
        const { action, commitMessage, hash } = body;

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        if (action === "commit") {
            if (!commitMessage) {
                return NextResponse.json({ success: false, error: "Commit message is required" }, { status: 400 });
            }
            const addResult = await executeGitCommand(project.path, ["add", "."]);
            const commitResult = await executeGitCommand(project.path, ["commit", "-m", commitMessage]);
            return NextResponse.json({
                success: true,
                message: "Changes committed successfully",
                data: `${addResult}\n${commitResult}`
            });
        } else if (action === "push") {
            const gitInfo = await getGitInfo(project.path);
            const branch = gitInfo.branch;
            if (!branch || branch === "unknown") {
                return NextResponse.json({ success: false, error: "Could not determine current branch" }, { status: 400 });
            }
            const pushResult = await executeGitCommand(project.path, ["push", "origin", branch]);
            return NextResponse.json({
                success: true,
                message: `Successfully pushed to origin ${branch}`,
                data: pushResult
            });
        } else if (action === "revert") {
            if (!hash || typeof hash !== "string") {
                return NextResponse.json({ success: false, error: "Commit hash is required" }, { status: 400 });
            }
            // Safe undo: create a new commit that reverses the target, never rewrites history.
            const revertResult = await executeGitCommand(project.path, ["revert", "--no-edit", hash]);
            return NextResponse.json({
                success: true,
                message: `Reverted commit ${hash}`,
                data: revertResult
            });
        }

        return NextResponse.json({ success: false, error: "Invalid git action" }, { status: 400 });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
