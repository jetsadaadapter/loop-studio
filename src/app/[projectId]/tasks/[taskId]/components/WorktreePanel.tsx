"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, RotateCcw, GitMerge, Loader2 } from "lucide-react";
import type { TaskGit } from "@/core/interfaces/loop-projects.interface";

interface WorktreePanelProps {
    projectId: string;
    taskId: string;
}

// Shows the task's dedicated git worktree: branch, checkpoints (rollback targets),
// and the integrate action. Reads/acts via GET/POST .../tasks/[taskId]/worktree.
// Empty when the project hasn't opted into per-task worktrees.
export function WorktreePanel({ projectId, taskId }: WorktreePanelProps) {
    const [git, setGit] = useState<TaskGit | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const base = `/api/loop-projects/${projectId}/tasks/${taskId}/worktree`;

    const load = useCallback(async () => {
        try {
            const res = await fetch(base);
            const data = await res.json();
            setGit(data.git ?? null);
            setError(data.success ? null : data.error ?? "Failed to load");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [base]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const act = async (body: Record<string, unknown>) => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(base, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!data.success) setError(data.error ?? "Action failed");
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Action failed");
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                <Loader2 className="size-4 animate-spin" /> Loading worktree…
            </div>
        );
    }

    if (!git) {
        return (
            <div className="text-xs text-slate-500 font-sans leading-relaxed">
                <p className="font-semibold text-slate-700">No task worktree</p>
                <p className="mt-1">
                    This project edits its working tree directly. Turn on <span className="font-medium text-slate-700">“Isolate tasks in a git worktree”</span> in
                    the project&apos;s Edit dialog to give each task its own <span className="font-mono text-slate-600">loop/task-*</span> branch with checkpoints, then run the task again.
                </p>
            </div>
        );
    }

    return (
        <div className="font-sans text-xs text-slate-700 space-y-4">
            {/* Branch header */}
            <div className="flex items-center gap-2">
                <GitBranch className="size-4 text-brand shrink-0" />
                <span className="font-mono text-slate-800">{git.branch}</span>
                <span className="text-slate-400">from</span>
                <span className="font-mono text-slate-500">{git.baseSha.slice(0, 7)}</span>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            {/* Checkpoints */}
            <div>
                <p className="font-semibold text-slate-700 mb-2">Checkpoints ({git.checkpoints.length})</p>
                {git.checkpoints.length === 0 ? (
                    <p className="text-slate-500">No checkpoints yet — they are committed after each agent edit batch.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {git.checkpoints.map((cp) => (
                            <li key={cp.sha} className="flex items-center gap-2">
                                <span className="font-mono text-slate-500 shrink-0">{cp.sha.slice(0, 7)}</span>
                                <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-slate-600 shrink-0">{cp.stage}</span>
                                <span className="truncate flex-1 min-w-0">{cp.label}</span>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => act({ action: "rollback", sha: cp.sha })}
                                    title="Reset the worktree to this checkpoint"
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                >
                                    <RotateCcw className="size-3.5" /> Rollback
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Integrate */}
            <div className="pt-2 border-t border-slate-200">
                {git.integration ? (
                    <p className="text-slate-600">
                        Integrated as <span className="font-semibold">{git.integration.mode}</span>
                        {git.integration.ref ? <> — <span className="font-mono">{git.integration.ref}</span></> : null}
                    </p>
                ) : (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => act({ action: "integrate", mode: "leave-branch" })}
                        className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <GitMerge className="size-3.5" /> Integrate (leave branch)
                    </button>
                )}
            </div>
        </div>
    );
}
