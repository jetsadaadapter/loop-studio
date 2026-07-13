"use client";

import React, { useEffect, useState } from "react";
import { Undo2, Loader2, RotateCw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GitCommit {
    hash: string;
    subject: string;
    relativeDate: string;
    insertions: number;
    deletions: number;
}

interface VersionTimelineProps {
    projectId: string;
    // Bumped by the parent (e.g. after a commit) to refetch the history.
    refreshKey?: number;
}

export function VersionTimeline({ projectId, refreshKey = 0 }: VersionTimelineProps) {
    const [commits, setCommits] = useState<GitCommit[]>([]);
    const [loading, setLoading] = useState(true);
    const [reverting, setReverting] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [reloadTick, setReloadTick] = useState(0);
    // The commit awaiting revert confirmation (null = dialog closed).
    const [confirmCommit, setConfirmCommit] = useState<GitCommit | null>(null);

    // Fetch on mount, when the project changes, on external refresh, or after a revert.
    useEffect(() => {
        let active = true;
        // Deferred to a microtask so it isn't a synchronous setState in the effect body.
        Promise.resolve().then(() => active && setLoading(true));
        fetch(`/api/loop-projects/${projectId}/commits`)
            .then((res) => res.json())
            .then((data) => {
                if (!active) return;
                if (data.success) setCommits(data.data as GitCommit[]);
                else setError(data.error || "Failed to load history.");
            })
            .catch(() => active && setError("Failed to load history."))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [projectId, refreshKey, reloadTick]);

    const handleRevert = async (hash: string) => {
        setConfirmCommit(null);
        setReverting(hash);
        setError("");
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "revert", hash }),
            });
            const data = await res.json();
            if (data.success) setReloadTick((t) => t + 1);
            else setError(data.error || "Revert failed.");
        } catch {
            setError("Revert failed due to a network error.");
        } finally {
            setReverting(null);
        }
    };

    return (
        <div className="h-full min-h-0 overflow-y-auto bg-white select-text">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-100 select-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                    Git Commit History
                </span>
                <button
                    type="button"
                    onClick={() => setReloadTick((t) => t + 1)}
                    aria-label="Refresh versions"
                    title="Refresh versions"
                    className="flex size-6 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                >
                    <RotateCw className="size-3.5" />
                </button>
            </div>

            {error && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

            {loading ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 animate-pulse font-sans">
                    <Loader2 className="size-3.5 animate-spin text-indigo-500" /> Loading history…
                </div>
            ) : commits.length === 0 ? (
                <p className="mt-3 text-xs text-slate-400 font-sans">No commits yet.</p>
            ) : (
                <ol className="mt-2 space-y-0.5">
                    {commits.map((c, idx) => (
                        <li
                            key={c.hash}
                            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
                        >
                            <span className={`size-1.5 shrink-0 rounded-full ${idx === 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs text-slate-700 font-medium">{c.subject}</p>
                                <p className="flex items-center gap-2 text-[10px] font-sans text-slate-400 mt-0.5">
                                    <span className="rounded bg-slate-100 px-1 py-px font-sans text-slate-500">{c.hash}</span>
                                    <span>{c.relativeDate}</span>
                                    {c.insertions > 0 && <span className="text-emerald-600">+{c.insertions}</span>}
                                    {c.deletions > 0 && <span className="text-rose-600">-{c.deletions}</span>}
                                    {idx === 0 && (
                                        <span className="rounded bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-px font-sans text-[9px]">current</span>
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmCommit(c)}
                                disabled={reverting !== null}
                                title="Revert this commit (creates an undo commit)"
                                className="flex items-center gap-1 rounded-sm border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 cursor-pointer shadow-3xs"
                            >
                                {reverting === c.hash ? <Loader2 className="size-3 animate-spin" /> : <Undo2 className="size-3" />}
                                Revert
                            </button>
                        </li>
                    ))}
                </ol>
            )}

            <Dialog open={confirmCommit !== null} onOpenChange={(open) => !open && setConfirmCommit(null)}>
                <DialogContent hideCloseButton className="w-full max-w-sm rounded-2xl border border-slate-200/60 bg-white p-5 shadow-xl focus:outline-none">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex size-11 items-center justify-center rounded-full border border-amber-200/60 bg-amber-50 text-amber-600">
                            <AlertTriangle className="size-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">Revert this commit?</h3>
                        <p className="text-xs leading-relaxed text-slate-500 font-sans">
                            This creates a new commit that undoes{" "}
                            <span className="font-semibold text-slate-700">{confirmCommit?.subject}</span>{" "}
                            (<span className="font-sans text-slate-500">{confirmCommit?.hash}</span>). Your history is
                            kept — nothing is deleted.
                        </p>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setConfirmCommit(null)}
                            className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => confirmCommit && handleRevert(confirmCommit.hash)}
                            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-sm bg-brand px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand/90"
                        >
                            <Undo2 className="size-3.5" />
                            Revert
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
