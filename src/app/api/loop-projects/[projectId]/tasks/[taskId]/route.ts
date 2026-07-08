import { NextResponse } from "next/server";
import { getProjects, saveProjects } from "@/core/services/loop-projects.service";
import { upsertKnowledgeEntry } from "@/core/services/loop-knowledge.service";
import type { LoopTask, RetroAnswers } from "@/core/interfaces/loop-projects.interface";

function setTaskField<K extends keyof LoopTask>(task: LoopTask, key: K, value: LoopTask[K]) {
    task[key] = value;
}

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
        return NextResponse.json({ success: true, data: task });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const body = await req.json();

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

        // Update fields
        const allowedUpdates: (keyof LoopTask)[] = ["status", "currentStage", "retroAnswers", "safetyNets", "testRunner", "kanbanColumn", "priority", "tags"];
        for (const key of allowedUpdates) {
            if (body[key] !== undefined) {
                setTaskField(task, key, body[key]);
            }
        }

        // Add activity if stage changed
        if (body.currentStage && body.currentStage !== task.currentStage) {
            task.activities.push({
                id: `act-${Date.now()}`,
                taskId: taskId,
                stage: body.currentStage,
                action: "stage_change",
                message: `Task advanced to stage: ${body.currentStage}`,
                timestamp: new Date().toISOString()
            });
        }

        task.updatedAt = new Date().toISOString();
        project.tasks[tIdx] = task;
        saveProjects(projects);

        // A submitted retrospective is project knowledge — persist it so the
        // planner and collaboration prompts of future runs can read it back.
        if (body.retroAnswers) {
            const retro = body.retroAnswers as RetroAnswers;
            upsertKnowledgeEntry(projectId, {
                taskId,
                taskName: task.name,
                source: "manual",
                learnings: [
                    retro.testsProven && `Tests: ${retro.testsProven}`,
                    retro.envVerified && `Environments: ${retro.envVerified}`,
                    retro.sideEffects && `Side effects: ${retro.sideEffects}`,
                ].filter((l): l is string => Boolean(l)),
            });
        }

        return NextResponse.json({ success: true, data: task });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const projects = getProjects();
        const pIdx = projects.findIndex((p) => p.id === projectId);
        if (pIdx === -1) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const project = projects[pIdx];
        project.tasks = project.tasks?.filter((t) => t.id !== taskId) ?? [];
        saveProjects(projects);

        return NextResponse.json({ success: true, message: "Task deleted successfully" });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
