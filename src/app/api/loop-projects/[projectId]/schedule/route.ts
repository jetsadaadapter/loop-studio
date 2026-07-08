import { NextResponse } from "next/server";
import { getProjects, saveProjects } from "@/core/services/loop-projects.service";
import { UpdateScheduleSchema } from "@/core/validators/loop-projects.validator";
import type { ProjectSchedule } from "@/core/interfaces/loop-projects.interface";

// GET   → the project's heartbeat schedule (or null if never configured)
// PATCH → enable/disable and set the cadence ({ enabled, intervalMinutes })

export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await context.params;
    const project = getProjects().find((p) => p.id === projectId);
    if (!project) {
        return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: project.schedule ?? null });
}

export async function PATCH(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const body = await req.json().catch(() => ({}));
        const parsed = UpdateScheduleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
        }

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const schedule: ProjectSchedule = {
            ...project.schedule,
            enabled: parsed.data.enabled,
            intervalMinutes: parsed.data.intervalMinutes,
        };
        project.schedule = schedule;
        saveProjects(projects);

        return NextResponse.json({ success: true, data: schedule });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
