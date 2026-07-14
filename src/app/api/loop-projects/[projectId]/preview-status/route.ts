import { NextResponse } from "next/server";
import { getProjects, checkUrlReachable } from "@/core/services/loop-projects.service";

// Only ever probes localhost/127.0.0.1 dev-server ports — matches the CSP
// frame-src allowance for the preview iframe (src/proxy.ts) and keeps this
// from being usable as an arbitrary server-side URL prober.
function isLocalPreviewUrl(url: string): boolean {
    try {
        const { hostname } = new URL(url);
        return hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
        return false;
    }
}

export async function GET(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const url = new URL(req.url).searchParams.get("url") || "";
        if (!isLocalPreviewUrl(url)) {
            return NextResponse.json({ success: false, error: "url must be an http(s) localhost/127.0.0.1 address" }, { status: 400 });
        }

        const reachable = await checkUrlReachable(url);
        return NextResponse.json({ success: true, data: { reachable } });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
