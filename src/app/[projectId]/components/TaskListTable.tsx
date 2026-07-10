"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import {
    TableContainer,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
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
    const router = useRouter();
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [deletingTask, setDeletingTask] = useState<LoopTask | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteConfirm = async () => {
        if (!deletingTask) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${deletingTask.id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                onRefresh?.();
                setDeletingTask(null);
            }
        } catch (e) {
            console.error("Failed to delete task:", e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
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
                                        <span className="mt-0.5 inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-sans text-slate-500">backlog</span>
                                    )}
                                    {isAwaitingApproval(t) && (
                                        <span className="mt-0.5 inline-block rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-xs font-sans text-amber-700">awaiting approval</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold font-sans ${getRiskColor(t.riskTier)}`}>
                                        {t.riskTier || "GREEN"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                                        {(t.tags ?? []).map((tag) => (
                                            <span key={tag} className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-xs font-sans text-indigo-700">{tag}</span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 truncate max-w-[180px]" title={t.targetFiles[0]}>
                                    {t.targetFiles[0]}
                                </TableCell>
                                <TableCell className="text-slate-500 uppercase font-sans tracking-wider text-xs">
                                    {t.currentStage}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize font-sans ${getStatusColor(t.status)}`}>
                                        {t.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <ManagerActionsDropdown
                                            actions={[
                                                {
                                                    label: "Enter Loop",
                                                    icon: ExternalLink,
                                                    onClick: () => {
                                                        router.push(`/${projectId}/tasks/${t.id}`);
                                                    }
                                                },
                                                ...(isAwaitingApproval(t) ? [{
                                                    label: "Approve",
                                                    icon: CheckCheck,
                                                    disabled: approvingId === t.id,
                                                    onClick: () => approve(t)
                                                }] : []),
                                                {
                                                    label: "Delete Task",
                                                    icon: Trash2,
                                                    variant: "destructive" as const,
                                                    showSeparatorBefore: true,
                                                    onClick: () => setDeletingTask(t)
                                                }
                                            ]}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {deletingTask && (
                <ManagerDeleteConfirm
                    itemName={deletingTask.name}
                    itemId={deletingTask.id}
                    itemTypeLabel="task"
                    onCancel={() => setDeletingTask(null)}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            )}
        </>
    );
}
