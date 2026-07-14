import { NextResponse } from "next/server";
import { z } from "zod";
import { isLocalUrl, runApiRequest } from "@/core/services/loop-preview.service";

// Backs the Preview pane's API console. Forwards one request to a project's local
// backend (localhost only) and returns a compact result. The no-auth API runs on
// the same machine, so we still reject non-loopback targets to avoid an open proxy.
const ApiRequestSchema = z.object({
    url: z.string().url("A valid URL is required."),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).default("GET"),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.string().optional(),
});

export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        await context.params; // projectId reserved for future request history/logging
        const parsed = ApiRequestSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
        }
        if (!isLocalUrl(parsed.data.url)) {
            return NextResponse.json({ success: false, error: "Only localhost targets are allowed." }, { status: 400 });
        }
        const data = await runApiRequest(parsed.data);
        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : "Request failed" },
            { status: 502 },
        );
    }
}
