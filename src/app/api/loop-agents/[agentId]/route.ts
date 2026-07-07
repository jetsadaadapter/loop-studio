import { NextResponse } from "next/server";
import { updateAgent, deleteAgent } from "@/core/services/loop-agents.service";
import { UpdateAgentSchema } from "@/core/validators/loop-projects.validator";

export async function PATCH(req: Request, context: { params: Promise<{ agentId: string }> }) {
    try {
        const { agentId } = await context.params;
        const body = await req.json();
        const parsed = UpdateAgentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
        }
        const updated = updateAgent(agentId, parsed.data);
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
