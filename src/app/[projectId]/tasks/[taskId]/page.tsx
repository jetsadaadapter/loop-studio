"use client";

import { use } from "react";
import Link from "next/link";
import { Clock, Coins, CheckCircle2 } from "lucide-react";
import { ChatPanel } from "@/app/loop-components/ChatPanel";
import { StudioWindow } from "@/app/loop-components/StudioWindow";
import { AppRail, ProjectSidebar } from "@/app/loop-components/ProjectSidebar";
import { useTaskWorkspace } from "./useTaskWorkspace";
import { TaskRightPanel } from "./TaskRightPanel";

interface TaskWorkspaceProps {
    params: Promise<{ projectId: string; taskId: string }>;
}

export default function TaskWorkspace({ params }: TaskWorkspaceProps) {
    const { projectId, taskId } = use(params);
    const {
        project,
        allProjects,
        task,
        activeStage,
        setActiveStage,
        loading,
        triggerCount,
        loadData,
        handleUpdateTask,
        triggerLogReload,
    } = useTaskWorkspace(projectId, taskId);

    if (loading) {
        return (
            <div className="flex h-60 items-center justify-center font-sans text-xs text-slate-500 animate-pulse">
                Loading task loop workspace...
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex flex-col h-60 items-center justify-center text-center p-4">
                <h3 className="text-sm font-semibold text-slate-800">Task Not Found</h3>
                <Link href={`/${projectId}`} className="mt-4 rounded-sm bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
                    Back to Workspace
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-white motion-hero-enter">
            <AppRail />
            <ProjectSidebar projects={allProjects} activeProjectId={projectId} />

            <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
                {/* Studio workspace: stretches 100% height and width to the remaining viewport */}
                <div className="flex-1 min-h-0 relative">
                    <StudioWindow
                        header={
                            /* Header section (clean, compact, with bottom border) */
                            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shrink-0 h-14 select-none">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="min-w-0">
                                        <h1 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-800">
                                            <span className="truncate">{task.name}</span>
                                            {task.status === "completed" && <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />}
                                        </h1>
                                        <p className="text-[10px] text-slate-400 font-sans truncate">
                                            ID: {task.id} &bull; Project: {project?.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1 text-[10px] text-slate-500">
                                        <Clock className="size-3 text-slate-400" />
                                        <span className="font-sans">Updated {new Date(task.updatedAt).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1 text-[10px] text-slate-500">
                                        <Coins className="size-3 text-amber-500" />
                                        <span className="font-semibold font-sans">${task.tokensUsed.cost.toFixed(3)}</span>
                                    </div>
                                </div>
                            </div>
                        }
                        left={
                            <ChatPanel
                                projectId={projectId}
                                taskId={task.id}
                                chatHistory={task.chatHistory}
                                onRefresh={loadData}
                                onTriggerLog={triggerLogReload}
                            />
                        }
                        right={
                            <TaskRightPanel
                                projectId={projectId}
                                project={project}
                                task={task}
                                activeStage={activeStage}
                                onSelectStage={setActiveStage}
                                onUpdateTask={handleUpdateTask}
                                loadData={loadData}
                                triggerLogReload={triggerLogReload}
                                triggerCount={triggerCount}
                            />
                        }
                    />
                </div>
            </section>
        </div>
    );
}
