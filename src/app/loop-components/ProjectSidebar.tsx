"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Search, Pin, LayoutDashboard, Layers3, Workflow, Folder, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

const COLLAPSE_STORAGE_KEY = "loop_sidebar_collapsed";

interface ProjectSidebarProps {
    projects: LoopProject[];
    /** Highlight this workspace as the current one (workspace pages). */
    activeProjectId?: string;
}

// Colored identity chip background per framework template, mirroring the
// reference design's per-project bullet colors (icon inside stays constant).
const TEMPLATE_DOT: Record<string, string> = {
    "nextjs-app": "bg-violet-500",
    "nextjs-pages": "bg-indigo-500",
    "vite-react": "bg-sky-500",
    nodejs: "bg-emerald-500",
    generic: "bg-slate-400",
};

// Fixed-width, never-collapsing icon rail: brand mark + top-level nav (Dashboard,
// AI Developer Team). Rendered alongside ProjectSidebar so the two stay
// independent — the workspace panel next to it can collapse without ever
// hiding these primary nav entry points.
export function AppRail() {
    const pathname = usePathname();
    const onDashboard = pathname === "/";
    const onAgents = pathname === "/agents";

    const railItemClass = (active: boolean) =>
        `flex size-8 items-center justify-center rounded-lg transition-colors ${
            active ? "bg-brand/10 text-brand" : "text-slate-400 hover:text-slate-700"
        }`;

    return (
        <nav className="flex w-12 h-full shrink-0 flex-col items-center border-r border-slate-200/60 bg-white">
            {/* h-[45px] + border-b match ProjectSidebar's own header band so this mark
                sits on the same horizontal line as the wordmark row next to it, with
                the divider continuing unbroken across both columns. */}
            <Link
                href="/"
                title="Loop Studio"
                className="flex h-[45px] w-full shrink-0 items-center justify-center border-b border-slate-200/60 text-slate-800 transition-transform hover:scale-105"
            >
                <Layers3 className="size-4" />
            </Link>
            <div className="mt-4 flex flex-col items-center gap-1">
                <Link href="/" title="Dashboard" aria-current={onDashboard ? "page" : undefined} className={railItemClass(onDashboard)}>
                    <LayoutDashboard className="size-4" />
                </Link>
                <Link href="/agents" title="AI Developer Team" aria-current={onAgents ? "page" : undefined} className={railItemClass(onAgents)}>
                    <Users className="size-4" />
                </Link>
            </div>
        </nav>
    );
}

// Collapsible workspace panel shared by the dashboard and workspace shells:
// workspace search, workspace list, and a footer identity card. Top-level nav
// now lives in the separate, always-visible AppRail above.
export function ProjectSidebar({ projects, activeProjectId }: ProjectSidebarProps) {
    const [query, setQuery] = useState("");
    // Collapsed = icon-only rail. Persisted so it stays put across the 4 pages
    // this sidebar is shared by, rather than resetting on every navigation.
    const [collapsed, setCollapsed] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCollapsed(true);
        }
    }, []);

    // "/" focuses workspace search from anywhere — skipped while typing in
    // another field. No visual hint in the box itself; a plain, undocumented
    // convenience shortcut.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
            if (e.key === "/" && !isTyping && !collapsed) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [collapsed]);

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
            return next;
        });
    };

    const filtered = query.trim()
        ? projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
        : projects;

    return (
        <aside className={`flex h-full shrink-0 flex-col border-r border-slate-200/60 bg-slate-50/60 transition-all duration-300 ease-in-out ${
            collapsed ? "w-12" : "w-64"
        }`}>
            {/* Brand wordmark row — the icon mark itself lives in AppRail; this is the
                workspace-panel name label, kept separate so collapsing this panel never
                hides the always-visible AppRail mark. */}
            <div className={`flex h-[45px] shrink-0 items-center gap-2 border-b border-slate-200/60 px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
                {!collapsed && (
                    <span className="flex min-w-0 items-center gap-1.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand text-white">
                            <Workflow className="size-3.5" />
                        </span>
                        <span className="truncate text-sm font-bold tracking-tight text-slate-800 font-sans">Loop Studio</span>
                    </span>
                )}
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-white hover:text-slate-700 cursor-pointer"
                >
                    {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
                </button>
            </div>

            {/* Workspace search */}
            {!collapsed && (
                <div className="px-3 pb-1 pt-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={searchRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search workspaces…"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/10 font-sans"
                        />
                    </div>
                </div>
            )}

            {/* Workspaces group */}
            <div className={`flex-1 overflow-y-auto pt-4 ${collapsed ? "px-2" : "px-3"}`}>
                {!collapsed && <p className="px-2.5 pb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Workspaces</p>}
                <nav className="space-y-0.5">
                    {projects.length === 0 ? (
                        !collapsed && <p className="px-2.5 py-3 text-xs text-slate-400 font-sans">No workspaces registered yet.</p>
                    ) : filtered.length === 0 ? (
                        !collapsed && <p className="px-2.5 py-3 text-xs text-slate-400 font-sans">No workspaces match “{query}”.</p>
                    ) : (
                        filtered.map((p) => {
                            const activeTasks = (p.tasks ?? []).filter((t) => t.status !== "completed").length;
                            const isActive = p.id === activeProjectId;
                            return (
                                <Link
                                    key={p.id}
                                    href={`/${p.id}`}
                                    title={p.name}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`group relative flex items-center gap-2.5 rounded-lg py-2 transition-all ${
                                        collapsed ? "justify-center px-0" : "px-2.5"
                                    } ${
                                        isActive ? "bg-brand/5" : "hover:bg-white hover:shadow-sm"
                                    }`}
                                >
                                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-md ${TEMPLATE_DOT[p.template] ?? TEMPLATE_DOT.generic}`}>
                                        <Folder className="size-3 text-white" />
                                    </span>
                                    {!collapsed && (
                                        <span className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                                            isActive ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"
                                        }`}>
                                            {p.name}
                                        </span>
                                    )}
                                    {p.isHost && !collapsed && (
                                        <Pin className="size-3 shrink-0 rotate-45 text-amber-500" aria-label="Pinned host app" />
                                    )}
                                    {activeTasks > 0 && (
                                        collapsed ? (
                                            <span className="absolute right-1 top-1 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white font-sans">
                                                {activeTasks}
                                            </span>
                                        ) : (
                                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white font-sans">
                                                {activeTasks}
                                            </span>
                                        )
                                    )}
                                </Link>
                            );
                        })
                    )}
                </nav>
            </div>

            {/* Footer status row — fixed to h-[52px] so it lines up with the other
                two bottom bars in this 3-column layout: the collapsed pipeline/logs
                bar and the chat input row, both also h-[52px]. A live-local status
                dot (no wordmark here — that now lives in the top brand row). */}
            <div className={`flex h-[52px] shrink-0 items-center gap-2 border-t border-slate-200/60 ${collapsed ? "justify-center px-0" : "px-3"}`}>
                <span
                    title={`${projects.length} workspace${projects.length === 1 ? "" : "s"} · running locally`}
                    className="relative flex size-2 shrink-0"
                >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {!collapsed && (
                    <p className="min-w-0 flex-1 truncate text-xs text-slate-500 font-sans">
                        {projects.length} workspace{projects.length === 1 ? "" : "s"} · local
                    </p>
                )}
            </div>
        </aside>
    );
}
