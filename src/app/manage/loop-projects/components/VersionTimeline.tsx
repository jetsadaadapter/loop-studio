"use client";

import React, { useEffect, useState } from "react";
import { GitCommitHorizontal, Undo2, Loader2, RotateCw } from "lucide-react";

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

    // Fetch on mount, when the project changes, on external refresh, or after a revert.
    useEffect(() => {
        let active = true;
        // Deferred to a microtask so it isn't a synchronous setState in the effect body.
        Promise.resolve().then(() => active && setLoading(true));
        fetch(`/api/manage/loop-projects/${projectId}/commits`)
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
        setReverting(hash);
        setError("");
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/git-action`, {
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-3xs">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <GitCommitHorizontal className="size-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-800">Versions</h3>
                </div>
                <button
                    type="button"
                    onClick={() => setReloadTick((t) => t + 1)}
                    aria-label="Refresh versions"
                    title="Refresh versions"
                    className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
                >
                    <RotateCw className="size-3.5" />
                </button>
            </div>

            {error && <div className="mt-3 rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

            {loading ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="size-3.5 animate-spin" /> Loading history…
                </div>
            ) : commits.length === 0 ? (
                <p className="mt-4 text-xs text-slate-400">No commits yet.</p>
            ) : (
                <ol className="mt-4 space-y-1.5">
                    {commits.map((c, idx) => (
                        <li
                            key={c.hash}
                            className="group flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50/60"
                        >
                            <span className="flex flex-col items-center">
                                <span className={`size-1.5 rounded-full ${idx === 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-700">{c.subject}</p>
                                <p className="flex items-center gap-2 text-[10px] font-sans text-slate-400">
                                    <span className="rounded bg-slate-100 px-1 py-px font-mono text-slate-500">{c.hash}</span>
                                    <span>{c.relativeDate}</span>
                                    {c.insertions > 0 && <span className="text-emerald-600">+{c.insertions}</span>}
                                    {c.deletions > 0 && <span className="text-rose-500">-{c.deletions}</span>}
                                    {idx === 0 && <span className="font-semibold text-emerald-600">current</span>}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRevert(c.hash)}
                                disabled={reverting !== null}
                                title="Revert this commit (creates an undo commit)"
                                className="flex items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
                            >
                                {reverting === c.hash ? <Loader2 className="size-3 animate-spin" /> : <Undo2 className="size-3" />}
                                Revert
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
