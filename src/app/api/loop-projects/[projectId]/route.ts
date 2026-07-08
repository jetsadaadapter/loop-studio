import { NextResponse } from "next/server";
import fs from "fs";
import { getProjects, saveProjects } from "@/core/services/loop-projects.service";
import { UpdateProjectSchema } from "@/core/validators/loop-projects.validator";
import type { ProjectTemplate } from "@/core/interfaces/loop-projects.interface";

export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: project });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

// Edit a registered project's metadata (name / path / template / previewUrl).
export async function PATCH(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const parsed = UpdateProjectSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
        }
        const input = parsed.data;

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        if (input.path !== undefined && input.path !== project.path) {
            if (!fs.existsSync(input.path)) {
                return NextResponse.json({ success: false, error: "Invalid project path or path does not exist" }, { status: 400 });
            }
            if (projects.some((p) => p.id !== projectId && p.path === input.path)) {
                return NextResponse.json({ success: false, error: "Project path already registered" }, { status: 400 });
            }
            project.path = input.path;
        }
        if (input.name !== undefined) project.name = input.name;
        if (input.template !== undefined) project.template = input.template as ProjectTemplate;
        if (input.previewUrl !== undefined) {
            if (input.previewUrl) project.previewUrl = input.previewUrl;
            else delete project.previewUrl;
        }

        project.updatedAt = new Date().toISOString();
        saveProjects(projects);
        return NextResponse.json({ success: true, data: project });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const projects = getProjects();
        const filtered = projects.filter((p) => p.id !== projectId);
        saveProjects(filtered);
        return NextResponse.json({ success: true, message: "Project unregistered successfully" });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
