"use client";

import React from "react";
import { GroupedTaskTable } from "./GroupedTaskTable";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

interface TaskViewProps {
    projectId: string;
    tasks: LoopTask[];
    onAddTask?: () => void;
    onRefresh?: () => void;
}

// Task backlog grouped by kanban column (Backlog/To Do/In Progress/Done),
// mirroring BoardView's grouping in table form.
export function TaskView({ projectId, tasks, onAddTask, onRefresh }: TaskViewProps) {
    return <GroupedTaskTable projectId={projectId} tasks={tasks} onAddTask={onAddTask} onRefresh={onRefresh} />;
}
