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

        let diff = "";

        // 1. Unstaged changes in working directory
        const unstagedArgs = ["diff"];
        if (task.targetFiles && task.targetFiles.length > 0) {
            unstagedArgs.push("--");
            unstagedArgs.push(...task.targetFiles);
        }
        diff = await executeGitCommand(project.path, unstagedArgs).catch(() => "");

        // 2. Staged changes (index)
        if (!diff || diff.trim() === "") {
            const stagedArgs = ["diff", "--cached"];
            if (task.targetFiles && task.targetFiles.length > 0) {
                stagedArgs.push("--");
                stagedArgs.push(...task.targetFiles);
            }
            diff = await executeGitCommand(project.path, stagedArgs).catch(() => "");
        }

        // 3. Fallback to the last commit modifying the target files
        if ((!diff || diff.trim() === "") && task.targetFiles && task.targetFiles.length > 0) {
            const logArgs = ["log", "-n", "1", "--pretty=format:%H", "--"];
            logArgs.push(...task.targetFiles);
            const lastCommitHash = await executeGitCommand(project.path, logArgs).then((h) => h.trim()).catch(() => "");
            
            if (lastCommitHash) {
                const commitDiffArgs = ["diff", `${lastCommitHash}~1`, lastCommitHash, "--"];
                commitDiffArgs.push(...task.targetFiles);
                let commitDiff = await executeGitCommand(project.path, commitDiffArgs).catch(() => "");

                // Fallback for initial commit (no parent revision)
                if (!commitDiff || commitDiff.trim() === "") {
                    const showArgs = ["show", lastCommitHash, "--"];
                    showArgs.push(...task.targetFiles);
                    commitDiff = await executeGitCommand(project.path, showArgs).catch(() => "");
                }

                if (commitDiff && commitDiff.trim() !== "") {
                    diff = commitDiff;
                }
            }
        }

        return NextResponse.json({ success: true, data: diff });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
