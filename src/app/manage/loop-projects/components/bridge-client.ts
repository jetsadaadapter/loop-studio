// Client helper: poll the IDE bridge until the agent replies, then finalize.
// Uses backoff so a long wait doesn't flood the network, and honors an
// AbortSignal so the caller can cancel (on a new send, unmount, or "Cancel").

export type BridgeOutcome = "done" | "error" | "timeout" | "cancelled";

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        if (signal?.aborted) return resolve();
        const t = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
    });
}

export async function resolveBridge(
    projectId: string,
    taskId: string,
    id: string,
    opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<BridgeOutcome> {
    const timeoutMs = opts.timeoutMs ?? 300_000; // give up after 5 min
    const signal = opts.signal;
    const base = `/api/manage/loop-projects/${projectId}/tasks/${taskId}/bridge`;
    const start = Date.now();
    let interval = 2_000;

    while (Date.now() - start < timeoutMs) {
        if (signal?.aborted) return "cancelled";
        try {
            const res = await fetch(`${base}?id=${encodeURIComponent(id)}`, { signal });
            const data = await res.json();
            if (data.status === "done") {
                await fetch(base, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                    signal,
                });
                return "done";
            }
            if (data.status === "error") return "error";
        } catch {
            if (signal?.aborted) return "cancelled";
            // transient network error — keep polling
        }
        await sleep(interval, signal);
        interval = Math.min(Math.round(interval * 1.5), 12_000); // backoff, capped at 12s
    }
    return "timeout";
}
