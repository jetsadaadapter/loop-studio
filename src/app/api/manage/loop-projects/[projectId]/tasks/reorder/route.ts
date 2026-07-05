import { NextResponse } from "next/server";
import { getProjects, saveProjects } from "@/core/services/loop-projects.service";

export async function PATCH(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const body = await req.json();
        const { taskId, kanbanColumn, priority, startDate, endDate, sprintId, storyPoints } = body;

        if (!taskId) {
            return NextResponse.json({ success: false, error: "taskId is required" }, { status: 400 });
        }

        const projects = getProjects();
        const pIdx = projects.findIndex((p) => p.id === projectId);
        if (pIdx === -1) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const project = projects[pIdx];
        const tIdx = project.tasks?.findIndex((t) => t.id === taskId) ?? -1;
        if (tIdx === -1) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        const task = project.tasks[tIdx];

        // Apply updates
        if (kanbanColumn !== undefined) {
            task.kanbanColumn = kanbanColumn;
            // Keep task status coherent with the board column, but NEVER mutate
            // currentStage: the loop pipeline stage (PLAN..LEARN) is an independent
            // axis from the board position, so moving a card must not wipe progress.
            if (kanbanColumn === "done") {
                task.status = "completed";
            } else if (kanbanColumn === "in_progress") {
                task.status = "running";
            } else if (kanbanColumn === "todo" || kanbanColumn === "backlog") {
                task.status = "pending";
            }
        }
        
        if (priority !== undefined) task.priority = priority;
        if (startDate !== undefined) task.startDate = startDate;
        if (endDate !== undefined) task.endDate = endDate;
        if (sprintId !== undefined) task.sprintId = sprintId;
        if (storyPoints !== undefined) task.storyPoints = Number(storyPoints);

        task.updatedAt = new Date().toISOString();
        project.tasks[tIdx] = task;

        saveProjects(projects);
        return NextResponse.json({ success: true, data: task });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
