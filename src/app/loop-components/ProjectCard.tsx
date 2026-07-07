"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, GitBranch, Coins, Trash2, ArrowRight } from "lucide-react";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface ProjectCardProps {
    project: LoopProject;
    onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
    const [gitInfo, setGitInfo] = useState<{ branch: string; commit: string }>({ branch: "...", commit: "..." });
    const [totalCost, setTotalCost] = useState<number>(0);

    useEffect(() => {
        // Fetch Git info
        fetch(`/api/loop-projects/${project.id}/git-info`)
            .then((res) => res.json())
            .then((res) => {
                if (res.success && res.data) {
                    setGitInfo({ branch: res.data.branch, commit: res.data.commit });
                }
            })
            .catch(() => {});

        // Sum token cost of all tasks
        const cost = (project.tasks || []).reduce((acc, t) => acc + (t.tokensUsed?.cost || 0), 0);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTotalCost(cost);
    }, [project]);

    return (
        <div className="relative group overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-500/30 backdrop-blur-md">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-linear-to-tr from-indigo-500/5 to-purple-500/5 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                        <Folder className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors duration-200">{project.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 font-sans mt-0.5 uppercase">
                            {project.template.replace("-", " ")}
                        </span>
                    </div>
                </div>
                
                <button
                    onClick={() => onDelete(project.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 cursor-pointer"
                    title="Unregister project"
                >
                    <Trash2 className="size-4" />
                </button>
            </div>

            <div className="mt-5 space-y-2.5">
                <div className="flex items-center text-xs text-slate-500 gap-2">
                    <Folder className="size-3.5 shrink-0" />
                    <span className="truncate select-all font-sans" title={project.path}>{project.path}</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <GitBranch className="size-3.5 text-slate-400" />
                        <span className="font-sans font-medium">{gitInfo.branch}</span>
                        <span className="text-slate-400">({gitInfo.commit})</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                        <Coins className="size-3.5 text-amber-500" />
                        <span className="font-sans font-medium text-slate-700">${totalCost.toFixed(3)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-2">
                <span className="text-xs font-sans text-slate-500">
                    {(project.tasks || []).length} active loop task{(project.tasks || []).length !== 1 ? "s" : ""}
                </span>
                
                <Link
                    href={`/${project.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 group/link transition-colors duration-200"
                >
                    Open Studio
                    <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}
