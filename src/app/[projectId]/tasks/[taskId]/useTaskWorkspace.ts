import { useEffect, useState } from "react";
import type { LoopProject, LoopTask, TaskStage } from "@/core/interfaces/loop-projects.interface";

/**
 * Loads and mutates the task-workspace data: the task, its project, and the
 * project list for the sidebar. Owns the shared stage + log-refresh signals that
 * both the chat panel and the right-hand workspace panel depend on.
 */
export function useTaskWorkspace(projectId: string, taskId: string) {
    const [project, setProject] = useState<LoopProject | null>(null);
    const [allProjects, setAllProjects] = useState<LoopProject[]>([]);
    const [task, setTask] = useState<LoopTask | null>(null);
    const [activeStage, setActiveStage] = useState<TaskStage>("PLAN");
    const [loading, setLoading] = useState(true);
    const [triggerCount, setTriggerCount] = useState(0);

    const loadData = async () => {
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}`);
            const data = await res.json();
            if (data.success && data.data) {
                setTask(data.data);
                // Also set active stage to task currentStage on first load
                if (!task) {
                    setActiveStage(data.data.currentStage || "PLAN");
                }
            }

            const pRes = await fetch(`/api/loop-projects/${projectId}`);
            const pData = await pRes.json();
            if (pRes.ok && pData.success) {
                setProject(pData.data);
            }

            const allRes = await fetch(`/api/loop-projects`);
            const allData = await allRes.json();
            if (allData.success) setAllProjects(allData.data || []);
        } catch (e) {
            console.error("Failed to load task details:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, taskId]);

    const handleUpdateTask = async (fields: Partial<LoopTask>) => {
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fields)
            });
            const data = await res.json();
            if (data.success) {
                loadData();
                if (fields.currentStage) {
                    setActiveStage(fields.currentStage);
                }
            }
        } catch (e) {
            console.error("Failed to update task:", e);
        }
    };

    const triggerLogReload = () => {
        setTriggerCount((prev) => prev + 1);
    };

    return {
        project,
        allProjects,
        task,
        activeStage,
        setActiveStage,
        loading,
        triggerCount,
        loadData,
        handleUpdateTask,
        triggerLogReload,
    };
}
