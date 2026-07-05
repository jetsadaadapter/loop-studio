"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, FolderPlus, HelpCircle } from "lucide-react";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ProjectCard } from "./components/ProjectCard";
import { RegisterModal } from "./components/RegisterModal";
import { BootstrapModal } from "./components/BootstrapModal";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

export default function LoopProjectsDashboard() {
    const [projects, setProjects] = useState<LoopProject[]>([]);
    const [searchValue, setSearchValue] = useState("");
    const [templateFilter, setTemplateFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isBootstrapOpen, setIsBootstrapOpen] = useState(false);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/manage/loop-projects");
            const data = await res.json();
            if (data.success) {
                setProjects(data.data || []);
            }
        } catch (e) {
            console.error("Failed to load projects:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProjects();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to unregister this project? Files on disk will NOT be deleted.")) return;
        try {
            const res = await fetch(`/api/manage/loop-projects/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                loadProjects();
            }
        } catch (e) {
            console.error("Failed to delete project:", e);
        }
    };

    // Filter projects
    const filteredProjects = projects.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchValue.toLowerCase()) || 
                              p.path.toLowerCase().includes(searchValue.toLowerCase());
        const matchesTemplate = templateFilter === "all" || p.template === templateFilter;
        return matchesSearch && matchesTemplate;
    });

    const filters = [
        {
            key: "template",
            label: "Framework",
            value: templateFilter,
            options: [
                { value: "all", label: "All Frameworks" },
                { value: "nextjs-app", label: "Next.js (App)" },
                { value: "nextjs-pages", label: "Next.js (Pages)" },
                { value: "vite-react", label: "Vite React" },
                { value: "nodejs", label: "Node.js" },
                { value: "generic", label: "Generic" },
            ],
            onChange: (val: string) => setTemplateFilter(val),
        }
    ];

    const toolbarTrailing = (
        <div className="flex items-center gap-2">
            <ManageRefreshButton
                isLoading={loading}
                isRefreshing={loading}
                onRefresh={loadProjects}
                title="Refresh Projects"
            />
            <button
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs"
            >
                <FolderPlus className="size-4 text-slate-500" />
                Register Existing
            </button>
            <button
                onClick={() => setIsBootstrapOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm"
            >
                <Plus className="size-4" />
                Bootstrap Project
            </button>
        </div>
    );

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Local Loop DevStudio</h1>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">Manage multiple workspaces, trace dependencies, and delegate tasks to AI Agents</p>
                </div>
                
                <Link
                    href="/manage/loop-projects/agents"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs self-start md:self-auto"
                >
                    <Users className="size-4 text-indigo-600" />
                    AI Developer Team
                </Link>
            </div>

            <ManagerToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search projects by name or path..."
                filters={filters}
                trailing={toolbarTrailing}
            />

            {loading && projects.length === 0 ? (
                <div className="flex h-60 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <span className="text-xs font-sans text-slate-500 animate-pulse">Loading DevStudio workspaces...</span>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col h-60 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <HelpCircle className="size-8 text-slate-400 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-800">No projects found</h3>
                    <p className="text-xs text-slate-500 font-sans mt-1 max-w-xs">Register an existing project directory or bootstrap a new Next.js / Vite project to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSuccess={loadProjects}
            />

            <BootstrapModal
                isOpen={isBootstrapOpen}
                onClose={() => setIsBootstrapOpen(false)}
                onSuccess={loadProjects}
            />
        </div>
    );
}
