import { NextResponse } from "next/server";
import { runApiChecks } from "@/core/services/loop-preview.service";

// Run all saved API checks for a project and report pass/fail. Same-origin POST
// (proxy middleware enforces it); each check hits a localhost target server-side.
export async function POST(_req: Request, context: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await context.params;
    const results = await runApiChecks(projectId);
    const allPassed = results.length > 0 && results.every((r) => r.ok);
    return NextResponse.json({ success: true, data: { results, allPassed } });
}
