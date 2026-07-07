import { NextResponse } from "next/server";
import { getAgents, createAgent } from "@/core/services/loop-agents.service";
import { CreateAgentSchema } from "@/core/validators/loop-projects.validator";

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
        const parsed = CreateAgentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
        }
        const newAgent = createAgent(parsed.data);
        return NextResponse.json({ success: true, data: newAgent });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
