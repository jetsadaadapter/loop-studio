"use client";

import React from "react";
import { TaskListTable } from "./TaskListTable";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

interface TaskViewProps {
    projectId: string;
    tasks: LoopTask[];
    onRefresh?: () => void;
}

// Task backlog — a single List view (Phase 4 collapsed the Board/Grouped toggles).
export function TaskView({ projectId, tasks, onRefresh }: TaskViewProps) {
    return <TaskListTable projectId={projectId} tasks={tasks} onRefresh={onRefresh} />;
}
