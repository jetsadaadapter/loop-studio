"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, Coins, FolderGit2 } from "lucide-react";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface WorkspaceHeaderProps {
    project: LoopProject | null;
    gitInfo: { branch: string; commit: string; modifiedFiles: string[] };
    totalCost: number;
}

function formatCreated(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Gradient hero banner (soft pastel petals) with the project identity on the
// left and CREATED / BRANCH / TRACKED COST meta columns on the right.
export function WorkspaceHeader({ project, gitInfo, totalCost }: WorkspaceHeaderProps) {
    const taskCount = project?.tasks?.length ?? 0;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-r from-rose-50 via-violet-50 to-amber-50 px-6 py-6 motion-hero-enter">
            {/* Ambient pastel petals (decorative only) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-16 left-1/4 size-56 rounded-full bg-violet-200/40 blur-3xl" />
                <div className="absolute -bottom-20 left-1/2 size-64 rounded-full bg-rose-200/40 blur-3xl" />
                <div className="absolute -top-10 right-8 size-48 rounded-full bg-amber-200/40 blur-3xl" />
            </div>

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <Link
                        href="/"
                        className="shrink-0 rounded-xl border border-white/70 bg-white/70 p-2 text-slate-500 shadow-sm backdrop-blur hover:bg-white transition-colors"
                        title="Back to dashboard"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-brand shadow-sm backdrop-blur">
                        <FolderGit2 className="size-6" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">{project?.name}</h1>
                        <p className="text-xs text-slate-500 font-sans mt-0.5 select-all truncate max-w-md" title={project?.path}>
                            {project?.path}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Created</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-700 font-sans">{formatCreated(project?.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Branch</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 font-sans">
                            <GitBranch className="size-3.5 text-slate-400" />
                            {gitInfo.branch}
                            <span className="font-normal text-slate-400">({gitInfo.commit})</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Tasks</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-700 font-sans">{taskCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Tracked Cost</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 font-sans">
                            <Coins className="size-3.5 text-amber-500" />
                            ${totalCost.toFixed(3)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
