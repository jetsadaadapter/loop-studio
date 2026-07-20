"use client";

import { useState } from "react";
import { PanelBottomOpen, PanelBottomClose, Maximize2, Minimize2 } from "lucide-react";
import type { LoopProject, LoopTask, TaskStage } from "@/core/interfaces/loop-projects.interface";
import { TimelineStages } from "@/app/loop-components/TimelineStages";
import { StageWorkspace } from "@/app/loop-components/StageWorkspace";
import { LogTerminal } from "@/app/loop-components/LogTerminal";
import { PreviewPane } from "@/app/loop-components/PreviewPane";
import { AutoPipeline } from "@/app/loop-components/AutoPipeline";
import { VersionTimeline } from "@/app/loop-components/VersionTimeline";
import { WorktreePanel } from "./components/WorktreePanel";

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

interface TaskRightPanelProps {
    projectId: string;
    project: LoopProject | null;
    task: LoopTask;
    activeStage: TaskStage;
    onSelectStage: (stage: TaskStage) => void;
    onUpdateTask: (fields: Partial<LoopTask>) => void;
    loadData: () => void;
    triggerLogReload: () => void;
    triggerCount: number;
}

/** Right column: live preview on top, collapsible pipeline/logs panel below. */
export function TaskRightPanel({
    projectId,
    project,
    task,
    activeStage,
    onSelectStage,
    onUpdateTask,
    loadData,
    triggerLogReload,
    triggerCount,
}: TaskRightPanelProps) {
    const [bottomTab, setBottomTab] = useState<"workspace" | "pipeline" | "logs" | "changes" | "worktree">("workspace");
    const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
    const [bottomPanelState, setBottomPanelState] = useState<"collapsed" | "standard" | "expanded">("collapsed");

    const { verify, build } = getPipelineStatus(task);

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50">
            {/* Top Half: Live App Preview Browser, Code & Diff (full height flex-1) */}
            <div className="flex-1 min-h-0 overflow-hidden border-b border-slate-200">
                <PreviewPane
                    initialUrl={project?.previewUrl || "/"}
                    isHost={project?.isHost}
                    verifyStatus={verify}
                    buildStatus={build}
                    riskTier={task.riskTier}
                    projectId={projectId}
                    projectTemplate={project?.template}
                    taskId={task.id}
                    taskName={task.name}
                    onPublished={loadData}
                    targetFiles={task.targetFiles}
                    deviceMode={deviceMode}
                    onDeviceModeChange={setDeviceMode}
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
                            title="Expand panel"
                            className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-750 hover:bg-slate-250/50 transition-all cursor-pointer"
                        >
                            <PanelBottomOpen className="size-4.5" />
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
                                    onSelectStage={onSelectStage}
                                    status={task.status}
                                />
                            </div>
                            <div className="flex items-center gap-1 pl-3 shrink-0 select-none border-l border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setBottomPanelState("collapsed")}
                                    title="Collapse panel"
                                    className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-750 hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    <PanelBottomClose className="size-4.5" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom panel tabs bar */}
                        <div className="flex items-center gap-4 px-4 border-b border-slate-200 bg-slate-50 shrink-0 h-9 select-none">
                            {([
                                { key: "workspace", label: "Active Stage Work" },
                                { key: "pipeline", label: "Pipeline Checks" },
                                { key: "changes", label: "Version Changes" },
                                { key: "worktree", label: "Worktree" },
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
                                    title={bottomPanelState === "expanded" ? "Restore to standard size" : "Maximize panel"}
                                    className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-750 hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    {bottomPanelState === "expanded" ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
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
                                    onUpdateTask={onUpdateTask}
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
                            {bottomTab === "worktree" && (
                                <WorktreePanel projectId={projectId} taskId={task.id} />
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
}
