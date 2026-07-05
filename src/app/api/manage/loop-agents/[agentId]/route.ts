import { NextResponse } from "next/server";
import { updateAgent, deleteAgent } from "@/core/services/loop-agents.service";

export async function PATCH(req: Request, context: { params: Promise<{ agentId: string }> }) {
    try {
        const { agentId } = await context.params;
        const body = await req.json();
        const updated = updateAgent(agentId, body);
        return NextResponse.json({ success: true, data: updated });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request, context: { params: Promise<{ agentId: string }> }) {
    try {
        const { agentId } = await context.params;
        deleteAgent(agentId);
        return NextResponse.json({ success: true, message: "Agent deleted successfully" });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
