"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Clock, Coins, CheckCircle2 } from "lucide-react";
import type { LoopProject, LoopTask, TaskStage } from "@/core/interfaces/loop-projects.interface";
import { TimelineStages } from "@/app/loop-components/TimelineStages";
import { StageWorkspace } from "@/app/loop-components/StageWorkspace";
import { ChatPanel } from "@/app/loop-components/ChatPanel";
import { LogTerminal } from "@/app/loop-components/LogTerminal";
import { PreviewPane } from "@/app/loop-components/PreviewPane";
import { AutoPipeline } from "@/app/loop-components/AutoPipeline";
import { VersionTimeline } from "@/app/loop-components/VersionTimeline";
import { StudioWindow } from "@/app/loop-components/StudioWindow";
import { StickyCrumbs } from "@/app/loop-components/StickyCrumbs";
import { ProjectSidebar } from "@/app/loop-components/ProjectSidebar";

interface TaskWorkspaceProps {
    params: Promise<{ projectId: string; taskId: string }>;
}

type CheckState = "pass" | "fail" | "idle";

// Read the latest auto-pipeline outcome (Phase 3) off the task's activity feed so
// the preview pane can show "Verify ✓  Build ✓" without a second network call.
function getPipelineStatus(task: LoopTask): { verify: CheckState; build: CheckState } {
    const last = [...task.activities].reverse().find((a) => a.action === "auto_pipeline");
    if (!last) return { verify: "idle", build: "idle" };
    if (last.message.includes("passed all checks")) return { verify: "pass", build: "pass" };
    if (last.message.includes("Unit tests")) return { verify: "fail", build: "idle" };
    return { verify: "pass", build: "fail" };
}

export default function TaskWorkspace({ params }: TaskWorkspaceProps) {
    const { projectId, taskId } = use(params);
    const [project, setProject] = useState<LoopProject | null>(null);
    const [allProjects, setAllProjects] = useState<LoopProject[]>([]);
    const [task, setTask] = useState<LoopTask | null>(null);
    const [activeStage, setActiveStage] = useState<TaskStage>("PLAN");
    const [loading, setLoading] = useState(true);
    const [triggerCount, setTriggerCount] = useState(0);

    const loadData = async () => {
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}`);
            const data = await res.json();
            if (data.success && data.data) {
                setTask(data.data);
                // Also set active stage to task currentStage on first load
                if (!task) {
                    setActiveStage(data.data.currentStage || "PLAN");
                }
            }

            const pRes = await fetch(`/api/loop-projects/${projectId}`);
            const pData = await pRes.json();
            if (pRes.ok && pData.success) {
                setProject(pData.data);
            }

            const allRes = await fetch(`/api/loop-projects`);
            const allData = await allRes.json();
            if (allData.success) setAllProjects(allData.data || []);
        } catch (e) {
            console.error("Failed to load task details:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, taskId]);

    const handleUpdateTask = async (fields: Partial<LoopTask>) => {
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fields)
            });
            const data = await res.json();
            if (data.success) {
                loadData();
                if (fields.currentStage) {
                    setActiveStage(fields.currentStage);
                }
            }
        } catch (e) {
            console.error("Failed to update task:", e);
        }
    };

    const triggerLogReload = () => {
        setTriggerCount((prev) => prev + 1);
    };

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
            <ProjectSidebar projects={allProjects} activeProjectId={projectId} />

            <section className="flex min-w-0 flex-1 flex-col space-y-6 overflow-y-auto px-6 pb-6">
            <StickyCrumbs
                items={[
                    { label: project?.name || "Project", href: `/${projectId}` },
                    { label: task.name },
                ]}
            />

            {/* Header section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-800">
                        <span className="truncate">{task.name}</span>
                        {task.status === "completed" && <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />}
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-sans truncate">
                        ID: {task.id} &bull; Project: {project?.name}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-600">
                        <Clock className="size-3.5 text-slate-400" />
                        <span className="font-sans">Updated {new Date(task.updatedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-600">
                        <Coins className="size-3.5 text-amber-500" />
                        <span className="font-semibold font-sans">${task.tokensUsed.cost.toFixed(3)}</span>
                    </div>
                </div>
            </div>

            {/* Studio workspace (v0 layout): one dark window — chat + changes on the
                left drive edits, the app previews live on the right. */}
            <StudioWindow
                projectId={projectId}
                projectName={project?.name || task.name}
                onPublished={loadData}
                left={
                    <>
                        <ChatPanel
                            projectId={projectId}
                            taskId={task.id}
                            chatHistory={task.chatHistory}
                            onRefresh={loadData}
                            onTriggerLog={triggerLogReload}
                        />
                        <VersionTimeline projectId={projectId} refreshKey={triggerCount} />
                    </>
                }
                right={
                    (() => {
                        const { verify, build } = getPipelineStatus(task);
                        return (
                            <>
                                <PreviewPane
                                    initialUrl={project?.previewUrl || "/"}
                                    verifyStatus={verify}
                                    buildStatus={build}
                                    riskTier={task.riskTier}
                                />

                                {/* Advanced controls: manual stage stepper, checkpoint runner,
                                    and run logs — proportioned like a config + history panel;
                                    scrolls with the preview in this same column. */}
                                <div className="space-y-4 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 font-sans">
                                        Advanced controls
                                    </p>

                                    <TimelineStages
                                        currentStage={task.currentStage}
                                        activeStage={activeStage}
                                        onSelectStage={setActiveStage}
                                        status={task.status}
                                    />

                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                        <div className="lg:col-span-2">
                                            <AutoPipeline
                                                projectId={projectId}
                                                taskId={task.id}
                                                onComplete={loadData}
                                                onTriggerLog={triggerLogReload}
                                            />
                                        </div>
                                        <div className="lg:col-span-1">
                                            <LogTerminal
                                                projectId={projectId}
                                                taskId={task.id}
                                                triggerCount={triggerCount}
                                            />
                                        </div>
                                    </div>

                                    <StageWorkspace
                                        projectId={projectId}
                                        task={task}
                                        activeStage={activeStage}
                                        onUpdateTask={handleUpdateTask}
                                        onTriggerLog={triggerLogReload}
                                    />
                                </div>
                            </>
                        );
                    })()
                }
            />
            </section>
        </div>
    );
}
