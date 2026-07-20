import { NextResponse } from "next/server";
import { getProjects, executeGitCommand, getGitInfo, isOwnGitRepo, isHostProject } from "@/core/services/loop-projects.service";

export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const body = await req.json();
        const { action, commitMessage, hash, remoteUrl, initialCommit } = body;

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        // "init" is the ONE action valid before the project has its own repo — it
        // creates one. Everything else requires the repo to already exist.
        if (action === "init") {
            if (isHostProject(project.path)) {
                return NextResponse.json({ success: false, error: "The host app already has its own git repository." }, { status: 400 });
            }
            if (await isOwnGitRepo(project.path)) {
                return NextResponse.json({ success: false, error: "This project is already a git repository." }, { status: 400 });
            }
            await executeGitCommand(project.path, ["init", "-b", "main"]);
            const steps: string[] = ["Initialized an empty git repository on branch main."];
            let warning: string | undefined;
            if (initialCommit) {
                try {
                    // `git add -A` respects the project's .gitignore, so node_modules
                    // and build output stay out of the first commit.
                    await executeGitCommand(project.path, ["add", "-A"]);
                    await executeGitCommand(project.path, ["commit", "-m", (typeof commitMessage === "string" && commitMessage.trim()) || "Initial commit"]);
                    steps.push("Created the initial commit.");
                } catch {
                    warning = "Repository initialized, but the initial commit failed — set your git user.name / user.email, then commit from the Version Changes tab.";
                }
            }
            if (typeof remoteUrl === "string" && remoteUrl.trim()) {
                try {
                    await executeGitCommand(project.path, ["remote", "add", "origin", remoteUrl.trim()]);
                    steps.push(`Linked remote origin → ${remoteUrl.trim()}`);
                } catch {
                    warning = `${warning ? warning + " " : ""}Could not add the remote (is one already set?).`;
                }
            }
            const gitInfo = await getGitInfo(project.path);
            return NextResponse.json({ success: true, message: "Git connected.", data: { steps, gitInfo }, warning });
        }

        // A project without its own git root resolves git commands against a
        // PARENT repo (e.g. a git-less folder under the host's .projects/) —
        // committing/pushing there would hit the wrong repository.
        if (!(await isOwnGitRepo(project.path))) {
            return NextResponse.json(
                { success: false, error: "This project has no git repository of its own. Connect Git first." },
                { status: 400 },
            );
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
