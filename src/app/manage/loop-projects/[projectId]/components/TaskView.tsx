"use client";

import React, { useState } from "react";
import { TaskListTable } from "./TaskListTable";
import { KanbanBoard } from "../../components/KanbanBoard";
import { GroupedList } from "../../components/GroupedList";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

interface TaskViewProps {
    projectId: string;
    tasks: LoopTask[];
    onUpdateTask: (taskId: string, fields: Partial<LoopTask>) => void;
}

type TaskSub = "list" | "board" | "grouped";

const SUBS: { key: TaskSub; label: string }[] = [
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "grouped", label: "Grouped" },
];

// Task flow — the same tasks shown as a table, a drag-and-drop Kanban board, or
// grouped by risk/priority. All edits (status, column, order) persist for real.
export function TaskView({ projectId, tasks, onUpdateTask }: TaskViewProps) {
    const [sub, setSub] = useState<TaskSub>("list");

    return (
        <div className="space-y-4">
            <div className="inline-flex rounded-sm border border-slate-200 bg-slate-50 p-0.5">
                {SUBS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setSub(key)}
                        className={`rounded-sm px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                            sub === key ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {sub === "list" && <TaskListTable projectId={projectId} tasks={tasks} />}
            {sub === "board" && <KanbanBoard projectId={projectId} tasks={tasks} onUpdateTask={onUpdateTask} />}
            {sub === "grouped" && <GroupedList projectId={projectId} tasks={tasks} />}
        </div>
    );
}
