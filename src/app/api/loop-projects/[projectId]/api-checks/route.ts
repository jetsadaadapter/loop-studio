import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiChecks, saveApiCheck, deleteApiCheck } from "@/core/services/loop-preview.service";

// Saved API checks for a project's backend — a request the user wants to re-run to
// verify the API still behaves. Persisted under .antigravity/api-checks-<id>.json.
const SaveSchema = z.object({
    name: z.string().trim().min(1, "Name is required.").max(120),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]),
    url: z.string().url(),
    body: z.string().optional(),
});

export async function GET(_req: Request, context: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await context.params;
    return NextResponse.json({ success: true, data: getApiChecks(projectId) });
}

export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await context.params;
    const parsed = SaveSchema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const check = { id: `chk-${Date.now()}`, createdAt: new Date().toISOString(), ...parsed.data };
    return NextResponse.json({ success: true, data: saveApiCheck(projectId, check) });
}

export async function DELETE(req: Request, context: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await context.params;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing check id." }, { status: 400 });
    return NextResponse.json({ success: true, data: deleteApiCheck(projectId, id) });
}
