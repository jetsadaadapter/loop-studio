import type { LoopTask, KanbanColumn, TaskPriority } from "@/core/interfaces/loop-projects.interface";
import type { BadgeVariant } from "@/components/ui/badge";

// Shared kanban grouping definitions — BoardView (cards) and GroupedTaskTable
// (rows) both group by the same columns and must stay visually consistent.
export const COLUMNS: { key: KanbanColumn; label: string; dot: string; badge: string }[] = [
    { key: "backlog", label: "Backlog", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
    { key: "todo", label: "To Do", dot: "bg-sky-500", badge: "bg-sky-100 text-sky-700" },
    { key: "in_progress", label: "In Progress", dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
    { key: "done", label: "Done", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
];

// Tasks created before the kanban field existed derive their column from status.
export function columnOf(t: LoopTask): KanbanColumn {
    if (t.kanbanColumn) return t.kanbanColumn;
    if (t.status === "completed") return "done";
    if (t.status === "running") return "in_progress";
    return "todo";
}

export const PRIORITY_CHIP: Record<TaskPriority, BadgeVariant> = {
    low: "success",
    medium: "warning",
    high: "orange",
    critical: "error",
};

export function shortDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
