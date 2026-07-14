"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2, ExternalLink, Plus } from "lucide-react";
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
import { COLUMNS, columnOf, PRIORITY_CHIP, shortDate } from "./task-grouping";

interface GroupedTaskTableProps {
    projectId: string;
    tasks: LoopTask[];
    /** Opens the create-task modal (per-group "+", mirrors BoardView's column add). */
    onAddTask?: () => void;
    onRefresh?: () => void;
}

const TIER_VARIANTS: Record<string, BadgeVariant> = {
    RED: "error",
    ORANGE: "orange",
    YELLOW: "warning",
    GREEN: "success",
};

// An auto-run leaves ORANGE/RED tasks completed at OBSERVE, still in the
// "in_progress" kanban column — that combination means "review, then approve".
function isAwaitingApproval(t: LoopTask) {
    return t.kanbanColumn === "in_progress" && t.status === "completed" && t.currentStage === "OBSERVE";
}

// Tasks grouped by kanban column, per-group table — the reference layout's
// "Backlog / In Progress / ... " sections, but built from real fields only:
// no Assignee column (no per-task assignee exists in the data model) and no
// editable due-date picker (dates are read-only here, same as everywhere else
// in the app).
export function GroupedTaskTable({ projectId, tasks, onAddTask, onRefresh }: GroupedTaskTableProps) {
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
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${deletingTask.id}`, { method: "DELETE" });
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
            <div className="space-y-5">
                {COLUMNS.map((col) => {
                    const items = tasks.filter((t) => columnOf(t) === col.key);
                    if (items.length === 0) return null;
                    return (
                        <div key={col.key}>
                            <div className="flex items-center gap-2 rounded-t-sm border border-b-0 border-slate-200 bg-slate-50 px-3 py-2">
                                <span className={`size-2 rounded-full ${col.dot}`} />
                                <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                                <span className={`flex size-5 items-center justify-center rounded-full text-xs font-bold font-sans ${col.badge}`}>
                                    {items.length}
                                </span>
                                {onAddTask && (
                                    <button
                                        onClick={onAddTask}
                                        className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors cursor-pointer"
                                        title="Create task"
                                    >
                                        <Plus className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            <TableContainer className="rounded-t-none">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/3">Task Title</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Tags</TableHead>
                                            <TableHead>Due date</TableHead>
                                            <TableHead>Risk Tier</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="font-semibold text-slate-800 max-w-[220px]" title={t.name}>
                                                    <span className="block truncate">{t.name}</span>
                                                    <span className="block text-[9.5px] text-slate-400 font-sans mt-0.5 select-all font-normal">ID: {t.id}</span>
                                                    {isAwaitingApproval(t) && (
                                                        <Badge variant="warning" className="mt-0.5">awaiting approval</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {t.priority ? (
                                                        <Badge variant={PRIORITY_CHIP[t.priority]}>{t.priority}</Badge>
                                                    ) : (
                                                        <Badge variant="default">Not set</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                                                        {(t.tags ?? []).map((tag) => (
                                                            <Badge key={tag} variant="info">{tag}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-sans">
                                                    {t.endDate ? shortDate(t.endDate) : <span className="text-slate-300">No due date</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={TIER_VARIANTS[t.riskTier || "GREEN"]}>
                                                        {t.riskTier || "GREEN"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end">
                                                        <ManagerActionsDropdown
                                                            actions={[
                                                                {
                                                                    label: "Enter Loop",
                                                                    icon: ExternalLink,
                                                                    onClick: () => router.push(`/${projectId}/tasks/${t.id}`),
                                                                },
                                                                ...(isAwaitingApproval(t) ? [{
                                                                    label: "Approve",
                                                                    icon: CheckCheck,
                                                                    disabled: approvingId === t.id,
                                                                    onClick: () => approve(t),
                                                                }] : []),
                                                                {
                                                                    label: "Delete Task",
                                                                    icon: Trash2,
                                                                    variant: "destructive" as const,
                                                                    showSeparatorBefore: true,
                                                                    onClick: () => setDeletingTask(t),
                                                                },
                                                            ]}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    );
                })}
            </div>

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
