import { NextRequest } from "next/server";
import { subscribeToLogs, taskLogPath } from "@/core/services/loop-projects.service";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { taskId } = await context.params;
        // taskLogPath runs taskId through assertSafeStoreId — a crafted id can't
        // traverse out of .antigravity to read an arbitrary file.
        const logFilePath = taskLogPath(taskId);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                // Send existing logs if file exists
                if (fs.existsSync(logFilePath)) {
                    try {
                        const existing = fs.readFileSync(logFilePath, "utf8");
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: existing })}\n\n`));
                    } catch (e) {
                        console.error("Failed to stream existing logs:", e);
                    }
                }

                // Subscribe to real-time logs
                const unsubscribe = subscribeToLogs(taskId, (chunk) => {
                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                    } catch (e) {
                        console.error("SSE enqueue failed:", e);
                    }
                });

                const intervalId = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(`: ping\n\n`));
                    } catch {
                        // Suppress write errors on closed stream
                    }
                }, 15000);

                req.signal.addEventListener("abort", () => {
                    unsubscribe();
                    clearInterval(intervalId);
                    try {
                        controller.close();
                    } catch {
                        // ignore
                    }
                });
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
