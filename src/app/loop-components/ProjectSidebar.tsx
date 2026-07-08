"use client";

import React from "react";
import Link from "next/link";
import { Users, FolderGit2, ChevronDown } from "lucide-react";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface ProjectSidebarProps {
    projects: LoopProject[];
}

// Colored identity dot per framework template, mirroring the reference
// design's per-project bullet colors.
const TEMPLATE_DOT: Record<string, string> = {
    "nextjs-app": "bg-violet-500",
    "nextjs-pages": "bg-indigo-500",
    "vite-react": "bg-sky-500",
    nodejs: "bg-emerald-500",
    generic: "bg-slate-400",
};

// Left navigation rail of the dashboard shell: the registered workspaces with
// active-task counts, plus the AI Developer Team shortcut pinned below.
export function ProjectSidebar({ projects }: ProjectSidebarProps) {
    return (
        <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200/60 bg-slate-50/60">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white mx-3 mt-4 px-3 py-2 shadow-sm">
                <span className="text-xs font-semibold text-slate-700">Workspaces</span>
                <ChevronDown className="size-3.5 text-slate-400" />
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {projects.length === 0 ? (
                    <p className="px-2 py-4 text-[11px] text-slate-400 font-sans">No projects registered yet.</p>
                ) : (
                    projects.map((p) => {
                        const activeTasks = (p.tasks ?? []).filter((t) => t.status !== "completed").length;
                        return (
                            <Link
                                key={p.id}
                                href={`/${p.id}`}
                                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <span className={`size-2 shrink-0 rounded-full ${TEMPLATE_DOT[p.template] ?? TEMPLATE_DOT.generic}`} />
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600 group-hover:text-slate-800">
                                    {p.name}
                                </span>
                                {activeTasks > 0 && (
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white font-sans">
                                        {activeTasks}
                                    </span>
                                )}
                            </Link>
                        );
                    })
                )}
            </nav>

            <div className="border-t border-slate-200/60 p-3 space-y-0.5">
                <Link
                    href="/agents"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-800 transition-all"
                >
                    <Users className="size-4 text-indigo-500" />
                    AI Developer Team
                </Link>
                <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] text-slate-400 font-sans">
                    <FolderGit2 className="size-4 text-slate-300" />
                    {projects.length} workspace{projects.length === 1 ? "" : "s"} registered
                </div>
            </div>
        </aside>
    );
}
