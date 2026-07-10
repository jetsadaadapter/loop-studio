"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ChevronRight, Search, Pin, LayoutDashboard, Workflow } from "lucide-react";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface ProjectSidebarProps {
    projects: LoopProject[];
    /** Highlight this workspace as the current one (workspace pages). */
    activeProjectId?: string;
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

// Left navigation rail shared by the dashboard and workspace shells. Styled
// after the reference dashboard: brand header, workspace search, grouped nav
// (Menu + Workspaces), and a footer identity card.
export function ProjectSidebar({ projects, activeProjectId }: ProjectSidebarProps) {
    const pathname = usePathname();
    const [query, setQuery] = useState("");

    const onDashboard = pathname === "/";
    const onAgents = pathname === "/agents";
    const filtered = query.trim()
        ? projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
        : projects;

    const navItemClass = (active: boolean) =>
        `relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
            active
                ? "bg-brand/5 text-slate-900 ring-1 ring-brand/15"
                : "text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-800"
        }`;

    return (
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/60 bg-slate-50/60">
            {/* Brand header */}
            <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm shadow-brand/20">
                    <Workflow className="size-4" />
                </span>
                <div className="leading-tight">
                    <p className="text-sm font-bold tracking-tight text-slate-800">Loop Studio</p>
                    <p className="text-xs text-slate-400 font-sans">AI agent control</p>
                </div>
            </div>

            {/* Workspace search */}
            <div className="px-3 pb-1">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search workspaces…"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-9 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/10 font-sans"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-400 font-sans">
                        ⌘K
                    </span>
                </div>
            </div>

            {/* Menu group */}
            <div className="px-3 pt-3">
                <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Menu</p>
                <Link href="/" className={navItemClass(onDashboard)}>
                    <LayoutDashboard className={`size-4 ${onDashboard ? "text-brand" : "text-slate-400"}`} />
                    Dashboard
                </Link>
                <Link href="/agents" aria-current={onAgents ? "page" : undefined} className={navItemClass(onAgents)}>
                    <Users className={`size-4 ${onAgents ? "text-brand" : "text-slate-400"}`} />
                    AI Developer Team
                </Link>
            </div>

            {/* Workspaces group */}
            <div className="flex-1 overflow-y-auto px-3 pt-4">
                <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Workspaces</p>
                <nav className="space-y-0.5">
                    {projects.length === 0 ? (
                        <p className="px-2.5 py-3 text-xs text-slate-400 font-sans">No workspaces registered yet.</p>
                    ) : filtered.length === 0 ? (
                        <p className="px-2.5 py-3 text-xs text-slate-400 font-sans">No workspaces match “{query}”.</p>
                    ) : (
                        filtered.map((p) => {
                            const activeTasks = (p.tasks ?? []).filter((t) => t.status !== "completed").length;
                            const isActive = p.id === activeProjectId;
                            return (
                                <Link
                                    key={p.id}
                                    href={`/${p.id}`}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all ${
                                        isActive ? "bg-brand/5 ring-1 ring-brand/15" : "hover:bg-white hover:shadow-sm"
                                    }`}
                                >
                                    <span className={`size-2 shrink-0 rounded-full ${TEMPLATE_DOT[p.template] ?? TEMPLATE_DOT.generic}`} />
                                    <span className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                                        isActive ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"
                                    }`}>
                                        {p.name}
                                    </span>
                                    {p.isHost && (
                                        <Pin className="size-3 shrink-0 rotate-45 text-amber-500" aria-label="Pinned host app" />
                                    )}
                                    {activeTasks > 0 && (
                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white font-sans">
                                            {activeTasks}
                                        </span>
                                    )}
                                </Link>
                            );
                        })
                    )}
                </nav>
            </div>

            {/* Footer identity card */}
            <div className="border-t border-slate-200/60 p-3">
                <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <Workflow className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-xs font-semibold text-slate-800">Loop Studio</p>
                        <p className="truncate text-xs text-slate-400 font-sans">
                            {projects.length} workspace{projects.length === 1 ? "" : "s"} · local
                        </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-slate-300" />
                </div>
            </div>
        </aside>
    );
}
