"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Clock, Coins, CheckCircle2, ChevronUp, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { LoopProject, LoopTask, TaskStage } from "@/core/interfaces/loop-projects.interface";
import { TimelineStages } from "@/app/loop-components/TimelineStages";
import { StageWorkspace } from "@/app/loop-components/StageWorkspace";
import { ChatPanel } from "@/app/loop-components/ChatPanel";
import { LogTerminal } from "@/app/loop-components/LogTerminal";
import { PreviewPane } from "@/app/loop-components/PreviewPane";
import { AutoPipeline } from "@/app/loop-components/AutoPipeline";
import { VersionTimeline } from "@/app/loop-components/VersionTimeline";
import { StudioWindow } from "@/app/loop-components/StudioWindow";
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
    const [bottomTab, setBottomTab] = useState<"workspace" | "pipeline" | "logs" | "changes">("workspace");
    const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
    const [loading, setLoading] = useState(true);
    const [triggerCount, setTriggerCount] = useState(0);
    const [bottomPanelState, setBottomPanelState] = useState<"collapsed" | "standard" | "expanded">("standard");
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
            {/* Collapsible sidebar */}
            <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
                sidebarOpen ? "w-64" : "w-0"
            }`}>
                <ProjectSidebar projects={allProjects} activeProjectId={projectId} />
            </div>

            <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
                {/* Studio workspace: stretches 100% height and width to the remaining viewport */}
                <div className="flex-1 min-h-0 relative">
                    <StudioWindow
                        projectId={projectId}
                        projectName={project?.name || task.name}
                        onPublished={loadData}
                        deviceMode={deviceMode}
                        onDeviceModeChange={setDeviceMode}
                        header={
                            /* Header section (clean, compact, with bottom border) */
                            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shrink-0 h-14 select-none">
                                <div className="flex items-center gap-2 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => setSidebarOpen((v) => !v)}
                                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                                        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
                                    >
                                        {sidebarOpen
                                            ? <PanelLeftClose className="size-4" />
                                            : <PanelLeftOpen className="size-4" />}
                                    </button>
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
                    (() => {
                        const { verify, build } = getPipelineStatus(task);
                        return (
                            <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50">
                                {/* Top Half: Live App Preview Browser, Code & Diff (full height flex-1) */}
                                <div className="flex-1 min-h-0 overflow-hidden border-b border-slate-200">
                                    <PreviewPane
                                        initialUrl={project?.previewUrl || "/"}
                                        verifyStatus={verify}
                                        buildStatus={build}
                                        riskTier={task.riskTier}
                                        projectId={projectId}
                                        taskId={task.id}
                                        targetFiles={task.targetFiles}
                                        deviceMode={deviceMode}
                                    />
                                </div>

                                {/* Bottom Half: Advanced controls (timeline stages + tabbed logs/execution panel) */}
                                <div className={`shrink-0 flex flex-col bg-white min-h-0 transition-all duration-300 ease-in-out border-t border-slate-200 ${
                                    bottomPanelState === "collapsed"
                                        ? "h-[52px] overflow-hidden"
                                        : bottomPanelState === "expanded"
                                            ? "h-[540px]"
                                            : "h-[320px]"
                                }`}>
                                    {bottomPanelState === "collapsed" ? (
                                        <div className="flex items-center justify-between px-4 h-full bg-slate-50 select-none">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex size-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                                                </span>
                                                <span className="text-xs font-semibold text-slate-700 font-sans">
                                                    Pipeline &amp; Logs
                                                </span>
                                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-sans uppercase font-bold tracking-wide">
                                                    {task.currentStage}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setBottomPanelState("standard")}
                                                title="Expand pipeline & logs"
                                                className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-750 hover:bg-slate-250/50 transition-all cursor-pointer"
                                            >
                                                <ChevronUp className="size-4.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* 6-Stage Connected Pipeline Timeline Bar */}
                                            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/50 shrink-0 flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <TimelineStages
                                                        currentStage={task.currentStage}
                                                        activeStage={activeStage}
                                                        onSelectStage={setActiveStage}
                                                        status={task.status}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 pl-3 shrink-0 select-none border-l border-slate-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBottomPanelState("collapsed")}
                                                        title="Minimize panel"
                                                        className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-750 hover:bg-slate-100 transition-all cursor-pointer"
                                                    >
                                                        <ChevronDown className="size-4.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Bottom panel tabs bar */}
                                            <div className="flex items-center gap-4 px-4 border-b border-slate-200 bg-slate-50 shrink-0 h-9 select-none">
                                                {([
                                                    { key: "workspace", label: "Active Stage Work" },
                                                    { key: "pipeline", label: "Pipeline Checks" },
                                                    { key: "changes", label: "Version Changes" },
                                                    { key: "logs", label: "Terminal Logs" }
                                                ] as const).map((t) => {
                                                    const active = bottomTab === t.key;
                                                    return (
                                                        <button
                                                            key={t.key}
                                                            type="button"
                                                            onClick={() => setBottomTab(t.key)}
                                                            className={`relative -mb-px flex items-center h-full border-b-2 px-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                                                                active
                                                                    ? "border-brand text-brand"
                                                                    : "border-transparent text-slate-500 hover:text-slate-700"
                                                            }`}
                                                        >
                                                            {t.label}
                                                        </button>
                                                    );
                                                })}
                                                
                                                {/* Maximize / Restore Toggle on the right side of the tab bar */}
                                                <div className="ml-auto flex items-center shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBottomPanelState(bottomPanelState === "expanded" ? "standard" : "expanded")}
                                                        title={bottomPanelState === "expanded" ? "Restore to standard" : "Maximize panel"}
                                                        className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-750 hover:bg-slate-100 transition-all cursor-pointer"
                                                    >
                                                        {bottomPanelState === "expanded" ? <ChevronDown className="size-4.5" /> : <ChevronUp className="size-4.5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Scrollable active tab panel */}
                                            <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-white">
                                                {bottomTab === "workspace" && (
                                                    <StageWorkspace
                                                        projectId={projectId}
                                                        task={task}
                                                        activeStage={activeStage}
                                                        onUpdateTask={handleUpdateTask}
                                                        onTriggerLog={triggerLogReload}
                                                    />
                                                )}
                                                {bottomTab === "pipeline" && (
                                                    <AutoPipeline
                                                        projectId={projectId}
                                                        taskId={task.id}
                                                        onComplete={loadData}
                                                        onTriggerLog={triggerLogReload}
                                                    />
                                                )}
                                                {bottomTab === "changes" && (
                                                    <VersionTimeline 
                                                        projectId={projectId} 
                                                        refreshKey={triggerCount} 
                                                    />
                                                )}
                                                {bottomTab === "logs" && (
                                                    <div className="h-full min-h-[180px]">
                                                        <LogTerminal
                                                            projectId={projectId}
                                                            taskId={task.id}
                                                            triggerCount={triggerCount}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()
                }
            />
                </div>
            </section>
        </div>
    );
}
