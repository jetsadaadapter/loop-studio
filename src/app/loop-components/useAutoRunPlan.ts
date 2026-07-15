import React, { useState, useEffect } from "react";
import type { EnrichedPlannedTask } from "@/core/services/loop-planner.service";
import { PlanFromGoalSchema, zodFieldErrors } from "@/core/validators/loop-projects.validator";
import { apiKeyHeader } from "./autorun-helpers";

interface UseAutoRunPlanArgs {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    onSuccess: (startedAutoRun: boolean) => void;
}

/**
 * Drives the Plan-from-Goal modal: goal text with "@"/"/" file autocomplete,
 * draft plan generation, and applying the plan (optionally kicking off auto-run).
 */
export function useAutoRunPlan({ isOpen, projectId, onClose, onSuccess }: UseAutoRunPlanArgs) {
    const [goal, setGoal] = useState("");
    const [drafts, setDrafts] = useState<EnrichedPlannedTask[] | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState<"plan" | "apply" | "run" | null>(null);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-complete files states
    const [projectFiles, setProjectFiles] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [triggerIndex, setTriggerIndex] = useState(-1);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    React.useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [goal, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let active = true;
        fetch(`/api/loop-projects/${projectId}/files`)
            .then((r) => r.json())
            .then((data) => {
                if (active && data.success) {
                    setProjectFiles(data.data || []);
                }
            })
            .catch(console.error);

        return () => {
            active = false;
        };
    }, [projectId, isOpen]);

    const handleSelectionChange = (val: string, selectionStart: number) => {
        if (!val) {
            setShowSuggestions(false);
            return;
        }
        const textBeforeCursor = val.slice(0, selectionStart);
        const lastSlash = textBeforeCursor.lastIndexOf("/");
        const lastAt = textBeforeCursor.lastIndexOf("@");
        const lastTrigger = Math.max(lastSlash, lastAt);

        if (lastTrigger !== -1) {
            const textBetween = textBeforeCursor.slice(lastTrigger + 1);
            // Must not contain spaces or newlines (typing a continuous path/file)
            if (!textBetween.includes(" ") && !textBetween.includes("\n")) {
                setTriggerIndex(lastTrigger);
                const query = textBetween.toLowerCase();
                const filtered = projectFiles.filter((f) => f.toLowerCase().includes(query));
                setSuggestions(filtered.slice(0, 10)); // limit to 10
                setShowSuggestions(filtered.length > 0);
                return;
            }
        }
        setShowSuggestions(false);
    };

    const selectSuggestion = (filePath: string) => {
        if (!selectedFiles.includes(filePath)) {
            setSelectedFiles((prev) => [...prev, filePath]);
        }

        const textarea = textareaRef.current;
        if (!textarea) return;

        const val = goal;
        // Strip the trigger and query from the text
        const before = val.slice(0, triggerIndex);
        const after = val.slice(textarea.selectionStart);
        const newVal = before + after;

        setGoal(newVal);
        setShowSuggestions(false);

        // Put focus back and place cursor where the trigger was
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(triggerIndex, triggerIndex);
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Backspace" && !goal && selectedFiles.length > 0) {
            e.preventDefault();
            setSelectedFiles((prev) => prev.slice(0, prev.length - 1));
            return;
        }

        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setShowSuggestions(false);
        }
    };

    const onGoalChange = (value: string, selectionStart: number) => {
        setGoal(value);
        if (error) setError("");
        handleSelectionChange(value, selectionStart);
    };

    const removeSelectedFile = (fileToRemove: string) => {
        setSelectedFiles((prev) => prev.filter((f) => f !== fileToRemove));
    };

    const reset = () => {
        setGoal("");
        setDrafts(null);
        setError("");
        setBusy(null);
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedFiles([]);
        setProjectFiles([]);
    };
    const close = () => { reset(); onClose(); };

    const generatePlan = async () => {
        setError("");
        const check = PlanFromGoalSchema.safeParse({ goal, apply: false });
        if (!check.success) {
            setError(zodFieldErrors(check.error).goal ?? check.error.issues[0].message);
            return;
        }
        setBusy("plan");
        try {
            const enrichedGoal = selectedFiles.length > 0
                ? `${goal}\n\nAttached files context:\n${selectedFiles.map(f => `- ${f}`).join("\n")}`
                : goal;
            const res = await fetch(`/api/loop-projects/${projectId}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                body: JSON.stringify({ goal: enrichedGoal, apply: false }),
            });
            const data = await res.json();
            if (data.success) setDrafts(data.data.tasks);
            else setError(data.error || "Failed to generate a plan.");
        } catch {
            setError("Failed to generate a plan due to a network error.");
        } finally {
            setBusy(null);
        }
    };

    const applyPlan = async (startRun: boolean) => {
        if (!drafts?.length) return;
        setError("");
        setBusy(startRun ? "run" : "apply");
        try {
            const enrichedGoal = selectedFiles.length > 0
                ? `${goal}\n\nAttached files context:\n${selectedFiles.map(f => `- ${f}`).join("\n")}`
                : goal;
            const res = await fetch(`/api/loop-projects/${projectId}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                body: JSON.stringify({ goal: enrichedGoal, apply: true, tasks: drafts }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.error || "Failed to create tasks."); return; }

            if (startRun) {
                const runRes = await fetch(`/api/loop-projects/${projectId}/auto-run`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                    body: JSON.stringify({ taskIds: data.data.tasks.map((t: { id: string }) => t.id) }),
                });
                const runData = await runRes.json();
                if (!runData.success) { setError(`Tasks created, but auto-run failed to start: ${runData.error}`); onSuccess(false); return; }
            }
            onSuccess(startRun);
            close();
        } catch {
            setError("Failed to create tasks due to a network error.");
        } finally {
            setBusy(null);
        }
    };

    return {
        goal,
        drafts,
        setDrafts,
        error,
        busy,
        textareaRef,
        suggestions,
        showSuggestions,
        activeIndex,
        selectedFiles,
        onGoalChange,
        handleSelectionChange,
        handleKeyDown,
        selectSuggestion,
        removeSelectedFile,
        close,
        generatePlan,
        applyPlan,
    };
}
