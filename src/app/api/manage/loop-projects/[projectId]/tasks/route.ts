import { NextResponse } from "next/server";
import { getProjects, saveProjects, calculateRiskTier } from "@/core/services/loop-projects.service";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: project.tasks || [] });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const body = await req.json();
        const { name, targetFiles } = body;

        if (!name || !targetFiles || !Array.isArray(targetFiles) || targetFiles.length === 0) {
            return NextResponse.json({ success: false, error: "Name and targetFiles are required" }, { status: 400 });
        }

        const projects = getProjects();
        const pIdx = projects.findIndex((p) => p.id === projectId);
        if (pIdx === -1) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const project = projects[pIdx];

        // Evaluate risk tier of primary target file
        const primaryFile = targetFiles[0];
        const { tier, count } = calculateRiskTier(project.path, primaryFile);

        // Assign safety nets based on calculated Risk Tier
        let safetyNets: string[] = [];
        if (tier === "RED") {
            safetyNets = [
                "Unit tests covering all edge cases",
                "Snapshot assertions for all usages",
                "Visual regression tests (Playwright)",
                "CI Guard validation run"
            ];
        } else if (tier === "ORANGE") {
            safetyNets = [
                "Unit tests for basic flows",
                "Snapshot assertions for all visual variants"
            ];
        } else if (tier === "YELLOW") {
            safetyNets = [
                "Standard unit tests",
                "Manual visual verification of 2-3 key states"
            ];
        } else {
            safetyNets = [
                "Basic unit test verification"
            ];
        }

        const newTask: LoopTask = {
            id: `task-${Date.now()}`,
            projectId: projectId,
            name: name,
            status: "pending",
            currentStage: "PLAN",
            targetFiles: targetFiles,
            riskTier: tier,
            safetyNets: safetyNets,
            logs: `[Plan] Task created with Risk Tier: ${tier} (imported in ${count} files)\n`,
            chatHistory: [
                {
                    id: `msg-init`,
                    role: "system",
                    senderName: "System",
                    content: `Task initialized. Risk tier assigned: ${tier}. Safety nets specified: ${safetyNets.join(", ")}`,
                    timestamp: new Date().toISOString()
                }
            ],
            activities: [
                {
                    id: `act-${Date.now()}`,
                    taskId: `task-${Date.now()}`,
                    stage: "PLAN",
                    action: "create",
                    message: `Created task with Risk Tier ${tier}`,
                    timestamp: new Date().toISOString()
                }
            ],
            tokensUsed: { input: 0, output: 0, cost: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (!project.tasks) project.tasks = [];
        project.tasks.push(newTask);
        saveProjects(projects);

        return NextResponse.json({ success: true, data: newTask });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
