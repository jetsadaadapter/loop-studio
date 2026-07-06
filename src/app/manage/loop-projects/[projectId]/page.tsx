"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Plus, HelpCircle, AlertTriangle, Loader2 } from "lucide-react";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { ViewTabs, type WorkspaceViewTab } from "./components/ViewTabs";
import { TaskView } from "./components/TaskView";
import { WalkthroughView } from "./components/WalkthroughView";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

interface ProjectWorkspaceProps {
    params: Promise<{ projectId: string }>;
}

export default function ProjectWorkspace({ params }: ProjectWorkspaceProps) {
    const { projectId } = use(params);
    const [project, setProject] = useState<LoopProject | null>(null);
    const [gitInfo, setGitInfo] = useState<{ branch: string; commit: string; modifiedFiles: string[] }>({
        branch: "...",
        commit: "...",
        modifiedFiles: [],
    });
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewTab, setViewTab] = useState<WorkspaceViewTab>("walkthrough");

    const loadData = async () => {
        setLoading(true);
        try {
            const pRes = await fetch(`/api/manage/loop-projects/${projectId}`);
            const pData = await pRes.json();
            if (pData.success) setProject(pData.data);

            const gRes = await fetch(`/api/manage/loop-projects/${projectId}/git-info`);
            const gData = await gRes.json();
            if (gData.success) setGitInfo(gData.data);
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
                <Link href="/manage/loop-projects" className="mt-4 rounded-sm bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90">
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
        return matchesSearch && matchesStatus;
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
    ];

    const toolbarTrailing = (
        <div className="flex items-center gap-2">
            <ManageRefreshButton isLoading={loading} isRefreshing={loading} onRefresh={loadData} title="Refresh Tasks" />
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
        <div className="flex flex-col space-y-6">
            <WorkspaceHeader project={project} gitInfo={gitInfo} totalCost={totalCost} />

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
                        <TaskView projectId={projectId} tasks={filteredTasks} />
                    )}
                </>
            )}

            {viewTab === "walkthrough" && (
                tasks.length === 0 ? emptyTasks : (
                    <WalkthroughView projectId={projectId} tasks={tasks} onRefresh={loadData} />
                )
            )}

            <CreateTaskModal
                isOpen={isCreateOpen}
                projectId={projectId}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}
