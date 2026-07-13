"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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

const TIER_VARIANTS: Record<string, BadgeVariant> = {
    RED: "error",
    ORANGE: "orange",
    YELLOW: "warning",
    GREEN: "success",
};

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
    running: "info",
    completed: "success",
    failed: "error",
};

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
            <TableContainer className="max-h-[calc(100vh-280px)] overflow-auto">
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
                                    <span className="block text-[9.5px] text-slate-400 font-sans mt-0.5 select-all font-normal">ID: {t.id}</span>
                                    {t.kanbanColumn === "backlog" && (
                                        <Badge variant="default" className="mt-0.5">backlog</Badge>
                                    )}
                                    {isAwaitingApproval(t) && (
                                        <Badge variant="warning" className="mt-0.5">awaiting approval</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={TIER_VARIANTS[t.riskTier || "GREEN"]}>
                                        {t.riskTier || "GREEN"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                                        {(t.tags ?? []).map((tag) => (
                                            <Badge key={tag} variant="info">{tag}</Badge>
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
                                    <Badge
                                        variant={STATUS_VARIANTS[t.status] || "default"}
                                        className={t.status === "running" ? "animate-pulse" : ""}
                                    >
                                        {t.status}
                                    </Badge>
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
