import { NextResponse } from "next/server";
import { getProjects, calculateRiskTier, getSafetyNets } from "@/core/services/loop-projects.service";

// Live risk-tier preview for the Create Task modal: given the primary target file,
// return the tier, its imports fan-out count, and the safety nets that will apply —
// so the user sees the impact before initializing the loop.
export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const file = new URL(req.url).searchParams.get("file")?.trim();
        if (!file) {
            return NextResponse.json({ success: false, error: "Missing file query param" }, { status: 400 });
        }

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const { tier, count } = await calculateRiskTier(project.path, file);
        return NextResponse.json({ success: true, data: { tier, count, safetyNets: getSafetyNets(tier) } });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
