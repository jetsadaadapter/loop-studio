"use client";

import React from "react";
import Link from "next/link";
import {
    FolderGit2,
    GitBranch,
    Coins,
    ListChecks,
    Users,
    ArrowRight,
    FileDiff,
} from "lucide-react";
import type { LoopProject, LoopTask, TaskStage, TaskStatus } from "@/core/interfaces/loop-projects.interface";

interface OverviewViewProps {
    projectId: string;
    project: LoopProject;
    tasks: LoopTask[];
    gitInfo: { branch: string; commit: string; modifiedFiles: string[] };
}

const STAGE_ORDER: TaskStage[] = ["PLAN", "BUILD", "VERIFY", "AUTOMATE", "OBSERVE", "LEARN"];

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200/60" },
    running: { label: "Running", className: "bg-indigo-50 text-indigo-700 border-indigo-200/60" },
    completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
    failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200/60" },
};

function CardShell({
    icon: Icon,
    title,
    children,
    className = "",
}: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-3xs flex flex-col gap-3 ${className}`}>
            <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="size-4" />
                </span>
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">{label}</span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[60%] text-right" title={value}>
                {value}
            </span>
        </div>
    );
}

export function OverviewView({ projectId, project, tasks, gitInfo }: OverviewViewProps) {
    const template = typeof project.template === "string" ? project.template : "";
    const createdAt = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A";

    const modifiedFiles = gitInfo.modifiedFiles || [];
    const visibleFiles = modifiedFiles.slice(0, 5);
    const remainingFilesCount = Math.max(modifiedFiles.length - visibleFiles.length, 0);

    const totalCost = tasks.reduce((acc, t) => acc + (t.tokensUsed?.cost || 0), 0);
    const totalInputTokens = tasks.reduce((acc, t) => acc + (t.tokensUsed?.input || 0), 0);
    const totalOutputTokens = tasks.reduce((acc, t) => acc + (t.tokensUsed?.output || 0), 0);

    const statusCounts: Record<TaskStatus, number> = { pending: 0, running: 0, completed: 0, failed: 0 };
    tasks.forEach((t) => {
        if (t.status in statusCounts) statusCounts[t.status] += 1;
    });

    const stageCounts: Record<TaskStage, number> = {
        PLAN: 0,
        BUILD: 0,
        VERIFY: 0,
        AUTOMATE: 0,
        OBSERVE: 0,
        LEARN: 0,
    };
    tasks.forEach((t) => {
        if (t.currentStage in stageCounts) stageCounts[t.currentStage] += 1;
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardShell icon={FolderGit2} title="Project Meta">
                <div className="flex flex-col gap-2">
                    <MetaRow label="Name" value={project.name || "Untitled"} />
                    <MetaRow label="Project ID" value={projectId} />
                    <MetaRow label="Path" value={project.path || "N/A"} />
                    <MetaRow label="Template" value={template || "generic"} />
                    <MetaRow label="Created" value={createdAt} />
                </div>
            </CardShell>

            <CardShell icon={GitBranch} title="Git Status">
                <div className="flex flex-col gap-2">
                    <MetaRow label="Branch" value={gitInfo.branch || "N/A"} />
                    <MetaRow label="Commit" value={gitInfo.commit || "N/A"} />
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Modified files</span>
                        <span className="text-xs font-semibold text-slate-700">{modifiedFiles.length}</span>
                    </div>
                    {visibleFiles.length > 0 ? (
                        <ul className="flex flex-col gap-1 border-t border-slate-100 pt-2">
                            {visibleFiles.map((file) => (
                                <li
                                    key={file}
                                    className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate"
                                    title={file}
                                >
                                    <FileDiff className="size-3 shrink-0 text-slate-400" />
                                    <span className="truncate">{file}</span>
                                </li>
                            ))}
                            {remainingFilesCount > 0 && (
                                <li className="text-[10px] font-semibold text-slate-400">
                                    +{remainingFilesCount} more
                                </li>
                            )}
                        </ul>
                    ) : (
                        <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">No modified files.</p>
                    )}
                </div>
            </CardShell>

            <CardShell icon={Coins} title="Cost & Usage">
                <div className="flex flex-col gap-3">
                    <div>
                        <span className="text-xl font-bold text-slate-800">${totalCost.toFixed(3)}</span>
                        <p className="text-[11px] text-slate-500">Total estimated cost</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <div>
                            <span className="text-xs font-semibold text-slate-700">{totalInputTokens.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-500">Input tokens</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-700">{totalOutputTokens.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-500">Output tokens</p>
                        </div>
                    </div>
                </div>
            </CardShell>

            <CardShell icon={ListChecks} title="Task Stats" className="lg:col-span-2">
                <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => {
                        const meta = STATUS_META[status as TaskStatus];
                        return (
                            <span
                                key={status}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
                            >
                                {meta.label}: {count}
                            </span>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    {STAGE_ORDER.map((stage) => (
                        <div key={stage} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {stage}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">{stageCounts[stage]}</span>
                        </div>
                    ))}
                </div>
            </CardShell>

            <CardShell icon={Users} title="AI Team">
                <p className="text-xs text-slate-500">
                    Manage the roster of AI developer agents assigned to this project.
                </p>
                <Link
                    href="/manage/loop-projects/agents"
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-3xs"
                >
                    Manage AI Developer Team
                    <ArrowRight className="size-3.5" />
                </Link>
            </CardShell>
        </div>
    );
}

export type { OverviewViewProps };
