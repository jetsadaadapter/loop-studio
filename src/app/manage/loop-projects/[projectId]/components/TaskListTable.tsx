"use client";

import React from "react";
import Link from "next/link";
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

export function TaskListTable({ projectId, tasks }: TaskListTableProps) {
    return (
        <TableContainer>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/3">Task Title</TableHead>
                        <TableHead>Risk Tier</TableHead>
                        <TableHead>Target File</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-semibold text-slate-800 truncate max-w-[200px]" title={t.name}>
                                {t.name}
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold font-sans ${getRiskColor(t.riskTier)}`}>
                                    {t.riskTier || "GREEN"}
                                </span>
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
                                <Link
                                    href={`/manage/loop-projects/${projectId}/tasks/${t.id}`}
                                    className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs"
                                >
                                    Enter Loop
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
