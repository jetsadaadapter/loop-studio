"use client";

// Saved-checks panel for the API console: list saved requests, run them all
// (2xx = pass), and delete. Backed by /api/loop-projects/[id]/api-checks[/run].
import { useEffect, useState } from "react";
import { Loader2, Play, Trash2 } from "lucide-react";

interface Check {
    id: string;
    name: string;
    method: string;
    url: string;
}
interface Result {
    id: string;
    ok: boolean;
    status: number;
    timeMs: number;
    error?: string;
}

const METHOD_COLOR: Record<string, string> = {
    GET: "text-indigo-600",
    POST: "text-emerald-600",
    PUT: "text-amber-600",
    PATCH: "text-violet-600",
    DELETE: "text-red-600",
};

export function ApiChecksPanel({ projectId }: { projectId: string }) {
    const [checks, setChecks] = useState<Check[]>([]);
    const [results, setResults] = useState<Record<string, Result>>({});
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const r = await fetch(`/api/loop-projects/${projectId}/api-checks`);
                const j = await r.json();
                if (!cancelled) setChecks(j.success ? j.data : []);
            } catch {
                /* leave empty */
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [projectId]);

    async function runAll() {
        setRunning(true);
        try {
            const r = await fetch(`/api/loop-projects/${projectId}/api-checks/run`, { method: "POST" });
            const j = await r.json();
            if (j.success) {
                const map: Record<string, Result> = {};
                for (const x of j.data.results as Result[]) map[x.id] = x;
                setResults(map);
            }
        } catch {
            /* ignore */
        } finally {
            setRunning(false);
        }
    }

    async function remove(id: string) {
        try {
            await fetch(`/api/loop-projects/${projectId}/api-checks?id=${id}`, { method: "DELETE" });
        } catch {
            /* ignore */
        }
        setChecks((c) => c.filter((x) => x.id !== id));
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-slate-400">
                <Loader2 className="size-4 animate-spin" />
            </div>
        );
    }
    if (checks.length === 0) {
        return (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs font-sans text-slate-400">
                ยังไม่มี check — กด &ldquo;Save check&rdquo; ที่แถบบนเพื่อบันทึก request ปัจจุบันเป็น check ที่ยิงซ้ำเพื่อ verify ได้
            </div>
        );
    }
    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Checks · {checks.length}</span>
                <button
                    type="button"
                    onClick={runAll}
                    disabled={running}
                    className="flex cursor-pointer items-center gap-1 rounded-sm bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold font-sans text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {running ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />} Run all
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
                {checks.map((c) => {
                    const res = results[c.id];
                    return (
                        <div key={c.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5">
                            <span className={`w-10 shrink-0 text-[9px] font-bold font-sans ${METHOD_COLOR[c.method] || "text-slate-500"}`}>{c.method}</span>
                            <span className="min-w-0 flex-1 truncate text-[11px] font-sans text-slate-700" title={c.url}>{c.name}</span>
                            {res ? (
                                <span className={`shrink-0 text-[10px] font-semibold font-sans ${res.ok ? "text-emerald-600" : "text-red-600"}`}>
                                    {res.error ? "ERR" : res.status} · {res.timeMs}ms
                                </span>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => remove(c.id)}
                                aria-label="ลบ check"
                                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-slate-300 hover:bg-slate-100 hover:text-red-600"
                            >
                                <Trash2 className="size-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
