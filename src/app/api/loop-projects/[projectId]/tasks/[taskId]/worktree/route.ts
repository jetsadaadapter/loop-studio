import { NextResponse } from "next/server";
import { getProjects } from "@/core/services/loop-projects.service";
import { rollbackTo, integrateTask, listCheckpoints } from "@/core/services/loop-worktree.service";

// Per-task worktree state + actions (checkpoints / rollback / integrate).
// See loop-worktree.service.ts and docs/branch-per-task-checkpoint.md.

function findTask(projectId: string, taskId: string) {
    const project = getProjects().find((p) => p.id === projectId);
    const task = project?.tasks?.find((t) => t.id === taskId);
    return { project, task };
}

// GET: the task's git state (branch, baseSha, checkpoints, integration) or null.
export async function GET(
    _req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> },
) {
    const { projectId, taskId } = await context.params;
    const { project, task } = findTask(projectId, taskId);
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    return NextResponse.json({ success: true, git: task.git ?? null });
}

// POST: { action: "rollback", sha } | { action: "integrate", mode }
export async function POST(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> },
) {
    const { projectId, taskId } = await context.params;
    const { project, task } = findTask(projectId, taskId);
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

    let body: { action?: string; sha?: string; mode?: "leave-branch" | "open-pr" | "merge" };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    try {
        if (body.action === "rollback") {
            if (!body.sha) return NextResponse.json({ success: false, error: "Missing 'sha'" }, { status: 400 });
            await rollbackTo(taskId, body.sha);
            return NextResponse.json({ success: true, checkpoints: listCheckpoints(taskId) });
        }
        if (body.action === "integrate") {
            const integration = await integrateTask(taskId, body.mode ?? "leave-branch");
            return NextResponse.json({ success: true, integration });
        }
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
    }
}
