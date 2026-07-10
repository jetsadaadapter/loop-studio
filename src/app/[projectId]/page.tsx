"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Plus, HelpCircle, AlertTriangle, Loader2, Sparkles, Clock } from "lucide-react";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { StickyCrumbs } from "../loop-components/StickyCrumbs";
import { ProjectSidebar } from "../loop-components/ProjectSidebar";
import { CreateTaskModal } from "../loop-components/CreateTaskModal";
import { AutoRunModal } from "../loop-components/AutoRunModal";
import { AutoRunProgress } from "../loop-components/AutoRunProgress";
import { ScheduleModal } from "../loop-components/ScheduleModal";
import { AVAILABLE_SKILLS } from "@/core/interfaces/loop-projects.interface";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { ViewTabs, type WorkspaceViewTab } from "./components/ViewTabs";
import { TaskView } from "./components/TaskView";
import { BoardView } from "./components/BoardView";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface ProjectWorkspaceProps {
    params: Promise<{ projectId: string }>;
}

export default function ProjectWorkspace({ params }: ProjectWorkspaceProps) {
    const { projectId } = use(params);
    const [project, setProject] = useState<LoopProject | null>(null);
    const [allProjects, setAllProjects] = useState<LoopProject[]>([]);
    const [gitInfo, setGitInfo] = useState<{ branch: string; commit: string; modifiedFiles: string[] }>({
        branch: "...",
        commit: "...",
        modifiedFiles: [],
    });
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAutoRunOpen, setIsAutoRunOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [viewTab, setViewTab] = useState<WorkspaceViewTab>("board");

    const loadData = async () => {
        setLoading(true);
        try {
            const pRes = await fetch(`/api/loop-projects/${projectId}`);
            const pData = await pRes.json();
            if (pData.success) setProject(pData.data);

            const gRes = await fetch(`/api/loop-projects/${projectId}/git-info`);
            const gData = await gRes.json();
            if (gData.success) setGitInfo(gData.data);

            const allRes = await fetch(`/api/loop-projects`);
            const allData = await allRes.json();
            if (allData.success) setAllProjects(allData.data || []);
        } catch (e) {
            console.error("Failed to load workspace data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    if (!project && !loading) {
        return (
            <div className="flex flex-col h-60 items-center justify-center p-6 text-center">
                <AlertTriangle className="size-8 text-red-500 mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">Project Not Found</h3>
                <p className="text-xs text-slate-500 font-sans mt-1">This workspace path might have been unregistered or moved.</p>
                <Link href="/" className="mt-4 rounded-sm bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-60 items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin" /> Loading workspace...
            </div>
        );
    }

    const tasks = project.tasks || [];
    const totalCost = tasks.reduce((acc, t) => acc + (t.tokensUsed?.cost || 0), 0);

    const filteredTasks = tasks.filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(searchValue.toLowerCase());
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesTag = tagFilter === "all" || (t.tags ?? []).includes(tagFilter);
        return matchesSearch && matchesStatus && matchesTag;
    });

    const filters = [
        {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: [
                { value: "all", label: "All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "running", label: "Running" },
                { value: "completed", label: "Completed" },
                { value: "failed", label: "Failed" },
            ],
            onChange: (val: string) => setStatusFilter(val),
        },
        {
            key: "tag",
            label: "Tag",
            value: tagFilter,
            options: [
                { value: "all", label: "All Tags" },
                ...AVAILABLE_SKILLS.map((s) => ({ value: s.key, label: s.label })),
            ],
            onChange: (val: string) => setTagFilter(val),
        },
    ];

    const toolbarTrailing = (
        <div className="flex items-center gap-2">
            <ManageRefreshButton isLoading={loading} isRefreshing={loading} onRefresh={loadData} title="Refresh Tasks" />
            <button
                onClick={() => setIsAutoRunOpen(true)}
                className="flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
            >
                <Sparkles className="size-4" />
                Plan from Goal
            </button>
            <button
                onClick={() => setIsScheduleOpen(true)}
                className="flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                title="Auto-run the backlog on a schedule"
            >
                <Clock className="size-4" />
                Schedule
            </button>
            <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm"
            >
                <Plus className="size-4" />
                Create Task
            </button>
        </div>
    );

    const emptyTasks = (
        <div className="flex flex-col h-60 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <HelpCircle className="size-8 text-slate-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No tasks yet</h3>
            <p className="text-xs text-slate-500 font-sans mt-1 max-w-xs">Create a task to trace dependencies and let the AI team implement and verify changes.</p>
            <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm"
            >
                <Plus className="size-4" /> Create Task
            </button>
        </div>
    );

    return (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-white motion-hero-enter">
            <ProjectSidebar projects={allProjects} activeProjectId={projectId} />

            <section className="flex min-w-0 flex-1 flex-col space-y-6 overflow-y-auto px-6 pb-6">
                <StickyCrumbs items={[{ label: project.name }]} />

                <WorkspaceHeader project={project} gitInfo={gitInfo} totalCost={totalCost} />

                <AutoRunProgress projectId={projectId} onRefresh={loadData} />

                <ViewTabs viewTab={viewTab} onChange={setViewTab} />

                {viewTab === "task" && (
                    <>
                        <ManagerToolbar
                            searchValue={searchValue}
                            onSearchChange={setSearchValue}
                            searchPlaceholder="Search tasks..."
                            filters={filters}
                            trailing={toolbarTrailing}
                        />
                        {filteredTasks.length === 0 ? emptyTasks : (
                            <TaskView projectId={projectId} tasks={filteredTasks} onRefresh={loadData} />
                        )}
                    </>
                )}

                {viewTab === "board" && (
                    tasks.length === 0 ? emptyTasks : (
                        <BoardView projectId={projectId} tasks={tasks} onAddTask={() => setIsCreateOpen(true)} />
                    )
                )}


            </section>

            <CreateTaskModal
                isOpen={isCreateOpen}
                projectId={projectId}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={loadData}
            />

            <AutoRunModal
                isOpen={isAutoRunOpen}
                projectId={projectId}
                onClose={() => setIsAutoRunOpen(false)}
                onSuccess={(startedAutoRun) => {
                    loadData();
                    if (startedAutoRun) setViewTab("task");
                }}
            />

            <ScheduleModal
                isOpen={isScheduleOpen}
                projectId={projectId}
                onClose={() => setIsScheduleOpen(false)}
                onSaved={loadData}
            />
        </div>
    );
}
