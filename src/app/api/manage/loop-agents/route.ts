import { NextResponse } from "next/server";
import { getAgents, createAgent } from "@/core/services/loop-agents.service";

export async function GET() {
    try {
        const agents = getAgents();
        return NextResponse.json({ success: true, data: agents });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newAgent = createAgent(body);
        return NextResponse.json({ success: true, data: newAgent });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
