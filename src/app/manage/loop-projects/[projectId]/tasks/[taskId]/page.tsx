"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Coins, CheckCircle2 } from "lucide-react";
import type { LoopProject, LoopTask, TaskStage } from "@/core/interfaces/loop-projects.interface";
import { TimelineStages } from "@/app/manage/loop-projects/components/TimelineStages";
import { StageWorkspace } from "@/app/manage/loop-projects/components/StageWorkspace";
import { ChatPanel } from "@/app/manage/loop-projects/components/ChatPanel";
import { LogTerminal } from "@/app/manage/loop-projects/components/LogTerminal";
import { PreviewPane } from "@/app/manage/loop-projects/components/PreviewPane";
import { AutoPipeline } from "@/app/manage/loop-projects/components/AutoPipeline";
import { VersionTimeline } from "@/app/manage/loop-projects/components/VersionTimeline";
import { StudioWindow } from "@/app/manage/loop-projects/components/StudioWindow";

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
    const [task, setTask] = useState<LoopTask | null>(null);
    const [activeStage, setActiveStage] = useState<TaskStage>("PLAN");
    const [loading, setLoading] = useState(true);
    const [triggerCount, setTriggerCount] = useState(0);

    const loadData = async () => {
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/${taskId}`);
            const data = await res.json();
            if (data.success && data.data) {
                setTask(data.data);
                // Also set active stage to task currentStage on first load
                if (!task) {
                    setActiveStage(data.data.currentStage || "PLAN");
                }
            }

            const pRes = await fetch(`/api/manage/loop-projects/${projectId}`);
            const pData = await pRes.json();
            if (pRes.ok && pData.success) {
                setProject(pData.data);
            }
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
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/${taskId}`, {
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
                <Link href={`/manage/loop-projects/${projectId}`} className="mt-4 rounded-sm bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
                    Back to Workspace
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <Link href={`/manage/loop-projects/${projectId}`} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            {task.name}
                            {task.status === "completed" && <CheckCircle2 className="size-4 text-emerald-500" />}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-sans tracking-wide mt-0.5">
                            ID: {task.id} &bull; Project: {project?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-sans text-slate-600">
                    <div className="flex items-center gap-1">
                        <Clock className="size-3.5 text-slate-400" />
                        <span>Updated: {new Date(task.updatedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg text-slate-700">
                        <Coins className="size-3.5 text-amber-500" />
                        <span className="font-sans font-medium">${task.tokensUsed.cost.toFixed(3)}</span>
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
                            <PreviewPane
                                initialUrl={project?.previewUrl || "/apps"}
                                verifyStatus={verify}
                                buildStatus={build}
                                riskTier={task.riskTier}
                            />
                        );
                    })()
                }
            />

            {/* Advanced controls: manual stage stepper, checkpoint runner, and run
                logs — kept for detail work; the Studio window above covers the
                everyday flow. */}
            <div className="space-y-4 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 font-sans">
                    Advanced controls
                </p>

                <TimelineStages
                    currentStage={task.currentStage}
                    activeStage={activeStage}
                    onSelectStage={setActiveStage}
                    status={task.status}
                />

                <AutoPipeline
                    projectId={projectId}
                    taskId={task.id}
                    onComplete={loadData}
                    onTriggerLog={triggerLogReload}
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <StageWorkspace
                        projectId={projectId}
                        task={task}
                        activeStage={activeStage}
                        onUpdateTask={handleUpdateTask}
                        onTriggerLog={triggerLogReload}
                    />

                    <LogTerminal
                        projectId={projectId}
                        taskId={task.id}
                        triggerCount={triggerCount}
                    />
                </div>
            </div>
        </div>
    );
}
