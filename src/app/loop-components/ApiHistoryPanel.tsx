"use client";

// Request-history panel for the API console. Click an entry to reload it into the
// builder. Times are relative to `now`, passed in so the component stays pure.
import { Trash2 } from "lucide-react";
import type { HistoryEntry } from "./apiHistory";

const METHOD_COLOR: Record<string, string> = {
    GET: "text-indigo-600",
    POST: "text-emerald-600",
    PUT: "text-amber-600",
    PATCH: "text-violet-600",
    DELETE: "text-red-600",
};

function ago(ms: number, now: number): string {
    const s = Math.max(0, Math.round((now - ms) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    return `${Math.round(s / 3600)}h`;
}

export function ApiHistoryPanel({
    entries,
    now,
    onReplay,
    onClear,
}: {
    entries: HistoryEntry[];
    now: number;
    onReplay: (e: HistoryEntry) => void;
    onClear: () => void;
}) {
    if (entries.length === 0) {
        return (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs font-sans text-slate-400">
                ยังไม่มีประวัติ — ยิง request แล้วจะถูกบันทึกไว้ที่นี่ (ต่อโปรเจกต์)
            </div>
        );
    }
    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">
                    History · {entries.length}
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    className="flex cursor-pointer items-center gap-1 text-[11px] font-sans text-slate-400 hover:text-red-600"
                >
                    <Trash2 className="size-3" /> ล้าง
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
                {entries.map((e) => (
                    <button
                        key={e.id}
                        type="button"
                        onClick={() => onReplay(e)}
                        className="flex w-full cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-left hover:bg-white"
                    >
                        <span className={`w-10 shrink-0 text-[9px] font-bold font-sans ${METHOD_COLOR[e.method] || "text-slate-500"}`}>
                            {e.method}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11px] font-sans text-slate-700">{e.path}</span>
                        <span className={`shrink-0 text-[10px] font-semibold font-sans ${e.ok ? "text-emerald-600" : "text-red-600"}`}>
                            {e.status}
                        </span>
                        <span className="w-7 shrink-0 text-right text-[10px] font-sans text-slate-400">{ago(e.at, now)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
