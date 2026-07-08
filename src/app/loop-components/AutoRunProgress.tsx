"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Square, CheckCircle2, AlertCircle, PauseCircle } from "lucide-react";
import type { AutoRunState, AutoRunOutcome } from "@/core/services/loop-autorun.service";

interface AutoRunProgressProps {
    projectId: string;
    /** Reload project data (task statuses change as the run progresses). */
    onRefresh: () => void;
}

const OUTCOME_META: Record<AutoRunOutcome, { icon: React.ReactNode; className: string; label: string }> = {
    done: { icon: <CheckCircle2 className="size-3.5" />, className: "text-emerald-700", label: "Done" },
    awaiting_approval: { icon: <PauseCircle className="size-3.5" />, className: "text-amber-700", label: "Awaiting approval" },
    failed: { icon: <AlertCircle className="size-3.5" />, className: "text-red-700", label: "Failed" },
};

// Polls the auto-run status while a run is active and renders a compact
// progress banner: current task, per-task outcomes, and a stop control.
export function AutoRunProgress({ projectId, onRefresh }: AutoRunProgressProps) {
    const [state, setState] = useState<AutoRunState | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const wasRunning = useRef(false);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;
        let cancelled = false;

        const poll = async () => {
            try {
                const res = await fetch(`/api/loop-projects/${projectId}/auto-run`);
                const data = await res.json();
                if (cancelled || !data.success) return;
                const next: AutoRunState | null = data.data;
                setState(next);
                if (next?.running) {
                    wasRunning.current = true;
                    setDismissed(false);
                    onRefresh();
                } else if (wasRunning.current) {
                    wasRunning.current = false;
                    onRefresh();
                }
            } catch {
                // Polling is best-effort; keep the last known state.
            }
        };

        poll();
        timer = setInterval(poll, 3000);
        return () => { cancelled = true; if (timer) clearInterval(timer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    if (!state || dismissed) return null;
    if (!state.running && state.results.length === 0) return null;

    const doneCount = state.results.length;

    return (
        <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        {state.running ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">
                            {state.running
                                ? `Auto-Run: ${doneCount}/${state.total} done — running "${state.currentTaskName ?? "…"}"`
                                : state.interrupted
                                    ? `Auto-Run interrupted by a server restart: ${doneCount}/${state.total} task(s) processed — the in-flight task is back in the backlog`
                                    : `Auto-Run finished: ${doneCount}/${state.total} task(s) processed`}
                        </p>
                        <p className="text-[11px] text-slate-500">
                            Low-risk tasks auto-commit; ORANGE/RED wait for your approval in the task list.
                        </p>
                    </div>
                </div>
                {state.running ? (
                    <button
                        onClick={() => fetch(`/api/loop-projects/${projectId}/auto-run`, { method: "DELETE" })}
                        className="flex shrink-0 items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <Square className="size-3" /> Stop after current
                    </button>
                ) : (
                    <button
                        onClick={() => setDismissed(true)}
                        className="shrink-0 rounded-sm px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                        Dismiss
                    </button>
                )}
            </div>

            {state.results.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-indigo-100 pt-2">
                    {state.results.map((r) => {
                        const meta = OUTCOME_META[r.outcome];
                        return (
                            <li key={r.taskId} className="flex items-center gap-2 text-[11px]">
                                <span className={meta.className}>{meta.icon}</span>
                                <span className="font-semibold text-slate-700 truncate">{r.name}</span>
                                <span className={`${meta.className} font-sans`}>{meta.label}</span>
                                <span className="text-slate-400 truncate font-sans" title={r.detail}>— {r.detail}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
