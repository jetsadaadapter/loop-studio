import { NextResponse } from "next/server";
import { getAgentsWithMetrics } from "@/core/services/loop-agent-metrics.service";

// GET /api/loop-agents/summary
// Roster enriched with per-agent metrics derived from real task history,
// backing the AI Developer Team dashboard.
export async function GET() {
    try {
        return NextResponse.json({ success: true, data: getAgentsWithMetrics() });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
