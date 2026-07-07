"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, Coins } from "lucide-react";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface WorkspaceHeaderProps {
    project: LoopProject | null;
    gitInfo: { branch: string; commit: string; modifiedFiles: string[] };
    totalCost: number;
}

export function WorkspaceHeader({ project, gitInfo, totalCost }: WorkspaceHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
                <Link href="/" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="size-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">{project?.name}</h1>
                    <p className="text-xs text-slate-500 font-sans mt-0.5 select-all truncate max-w-lg" title={project?.path}>{project?.path}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg text-slate-600">
                    <GitBranch className="size-4 text-slate-400" />
                    <span className="font-sans font-medium">{gitInfo.branch}</span>
                    <span className="text-slate-400">({gitInfo.commit})</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg text-slate-600">
                    <Coins className="size-4 text-amber-500" />
                    <span className="font-sans font-medium text-slate-700">${totalCost.toFixed(3)}</span>
                </div>
            </div>
        </div>
    );
}
