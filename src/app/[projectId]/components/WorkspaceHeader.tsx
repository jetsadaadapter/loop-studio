"use client";

import React from "react";
import { GitBranch, Coins, ListChecks } from "lucide-react";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface WorkspaceHeaderProps {
    project: LoopProject | null;
    gitInfo: { branch: string; commit: string; modifiedFiles: string[] };
    totalCost: number;
}

// Clean page header per the reference layout: big title + one-line
// description on the left, compact meta chips on the right.
export function WorkspaceHeader({ project, gitInfo, totalCost }: WorkspaceHeaderProps) {
    const taskCount = project?.tasks?.length ?? 0;

    const chip = "flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-600";

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-800 truncate">
                    {project?.name}
                    {project?.isHost && (
                        <span className="rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-xs font-semibold uppercase text-amber-700 font-sans">
                            Host App
                        </span>
                    )}
                </h1>
                <p className="mt-1 text-xs text-slate-500 font-sans select-all truncate max-w-xl" title={project?.path}>
                    {project?.path}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className={chip}>
                    <GitBranch className="size-3.5 text-slate-400" />
                    <span className="font-semibold font-sans">{gitInfo.branch}</span>
                    <span className="text-slate-400 font-sans">({gitInfo.commit})</span>
                </div>
                <div className={chip}>
                    <ListChecks className="size-3.5 text-slate-400" />
                    <span className="font-semibold font-sans">{taskCount}</span>
                    <span className="text-slate-400 font-sans">tasks</span>
                </div>
                <div className={chip}>
                    <Coins className="size-3.5 text-amber-500" />
                    <span className="font-semibold font-sans">${totalCost.toFixed(3)}</span>
                </div>
            </div>
        </div>
    );
}
