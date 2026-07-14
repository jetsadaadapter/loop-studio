"use client";

// Response viewer for the API console: status/time/size header + pretty body.
export interface ApiResponse {
    status: number;
    statusText: string;
    ok: boolean;
    timeMs: number;
    size: number;
    contentType: string;
    body: string;
}

function prettyBody(res: ApiResponse): string {
    if (res.contentType.includes("json")) {
        try {
            return JSON.stringify(JSON.parse(res.body), null, 2);
        } catch {
            /* not valid JSON — show raw */
        }
    }
    return res.body;
}

function formatSize(bytes: number): string {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export function ApiResponseView({ res }: { res: ApiResponse }) {
    const tone = res.ok
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-red-700 border-red-200";
    return (
        <>
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 text-[11px] font-sans text-slate-500">
                <span className={`rounded-full border px-2 py-0.5 font-semibold ${tone}`}>
                    {res.status} {res.statusText}
                </span>
                <span>{res.timeMs} ms</span>
                <span>{formatSize(res.size)}</span>
                <span className="truncate text-slate-400">{res.contentType || "—"}</span>
            </div>
            <pre className="overflow-auto whitespace-pre-wrap break-words p-3 text-[11px] leading-relaxed text-slate-800 font-mono">
                {prettyBody(res)}
            </pre>
        </>
    );
}
