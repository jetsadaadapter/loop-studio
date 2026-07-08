"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCheck } from "lucide-react";
import {
    TableContainer,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

interface TaskListTableProps {
    projectId: string;
    tasks: LoopTask[];
    onRefresh?: () => void;
}

function getRiskColor(tier?: string) {
    switch (tier) {
        case "RED": return "bg-red-50 text-red-700 border-red-200/60";
        case "ORANGE": return "bg-orange-50 text-orange-700 border-orange-200/60";
        case "YELLOW": return "bg-amber-50 text-amber-700 border-amber-200/60";
        default: return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case "running": return "bg-indigo-50 text-indigo-700 border-indigo-200/60 animate-pulse";
        case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
        case "failed": return "bg-red-50 text-red-700 border-red-200/60";
        default: return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
}

// An auto-run leaves ORANGE/RED tasks completed at OBSERVE, still in the
// "in_progress" kanban column — that combination means "review, then approve".
function isAwaitingApproval(t: LoopTask) {
    return t.kanbanColumn === "in_progress" && t.status === "completed" && t.currentStage === "OBSERVE";
}

export function TaskListTable({ projectId, tasks, onRefresh }: TaskListTableProps) {
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const approve = async (task: LoopTask) => {
        setApprovingId(task.id);
        try {
            await fetch(`/api/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "commit", commitMessage: `feat: ${task.name}` }),
            });
            await fetch(`/api/loop-projects/${projectId}/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed", currentStage: "LEARN", kanbanColumn: "done" }),
            });
            onRefresh?.();
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <TableContainer>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/3">Task Title</TableHead>
                        <TableHead>Risk Tier</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Target File</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-semibold text-slate-800 max-w-[220px]" title={t.name}>
                                <span className="block truncate">{t.name}</span>
                                {t.kanbanColumn === "backlog" && (
                                    <span className="mt-0.5 inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-sans text-slate-500">backlog</span>
                                )}
                                {isAwaitingApproval(t) && (
                                    <span className="mt-0.5 inline-block rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-sans text-amber-700">awaiting approval</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold font-sans ${getRiskColor(t.riskTier)}`}>
                                    {t.riskTier || "GREEN"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-[140px]">
                                    {(t.tags ?? []).map((tag) => (
                                        <span key={tag} className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-[10px] font-sans text-indigo-700">{tag}</span>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-slate-500 truncate max-w-[180px]" title={t.targetFiles[0]}>
                                {t.targetFiles[0]}
                            </TableCell>
                            <TableCell className="text-slate-500 uppercase font-sans tracking-wider text-[10px]">
                                {t.currentStage}
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize font-sans ${getStatusColor(t.status)}`}>
                                    {t.status}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                    {isAwaitingApproval(t) && (
                                        <button
                                            onClick={() => approve(t)}
                                            disabled={approvingId === t.id}
                                            className="inline-flex items-center gap-1 rounded-sm border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer shadow-3xs"
                                            title="Commit this task's changes and close it"
                                        >
                                            {approvingId === t.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCheck className="size-3" />}
                                            Approve
                                        </button>
                                    )}
                                    <Link
                                        href={`/${projectId}/tasks/${t.id}`}
                                        className="inline-block rounded-sm border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs"
                                    >
                                        Enter Loop
                                    </Link>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
