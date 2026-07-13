"use client";

import React, { useState } from "react";
import type { LoopTask, TaskStage, RetroAnswers } from "@/core/interfaces/loop-projects.interface";
import { PlanStage } from "./PlanStage";
import { BuildStage } from "./BuildStage";
import { VerifyStage } from "./VerifyStage";
import { AutomateStage } from "./AutomateStage";
import { ObserveStage } from "./ObserveStage";
import { LearnStage } from "./LearnStage";

interface StageWorkspaceProps {
    projectId: string;
    task: LoopTask;
    activeStage: TaskStage;
    onUpdateTask: (fields: Partial<LoopTask>) => void;
    onTriggerLog: () => void;
}

export function StageWorkspace({ projectId, task, activeStage, onUpdateTask, onTriggerLog }: StageWorkspaceProps) {
    // Advancing only makes sense while viewing the task's actual live stage — an
    // already-completed task, or a past/future stage node clicked just to preview
    // its workspace, must not expose a live "advance" action that would silently
    // regress or skip task.currentStage.
    const readOnly = activeStage !== task.currentStage || task.status === "completed";
    const [runner, setRunner] = useState<"vitest" | "playwright">(task.testRunner || "vitest");
    const [runningAction, setRunningAction] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Retro answers form state
    const [retroAnswers, setRetroAnswers] = useState<RetroAnswers>({
        testsProven: task.retroAnswers?.testsProven || "",
        envVerified: task.retroAnswers?.envVerified || "",
        sideEffects: task.retroAnswers?.sideEffects || "",
    });

    const handleAction = async (type: string) => {
        setRunningAction(type);
        onTriggerLog();
        try {
            await fetch(`/api/loop-projects/${projectId}/tasks/${task.id}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            });
            // Update local task runner preference
            if (type === "vitest" || type === "playwright") {
                onUpdateTask({ testRunner: type as "vitest" | "playwright" });
            }
        } catch {
            // ignore
        } finally {
            setTimeout(() => setRunningAction(null), 2000);
        }
    };

    const handleRetroSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateTask({
            currentStage: "LEARN",
            status: "completed",
            retroAnswers: retroAnswers
        });
    };

    const handleNextStage = (next: TaskStage) => {
        onUpdateTask({ currentStage: next });
    };

    const buildPrompt = `1. Scope: Only modify files: ${task.targetFiles.join(", ")}. Do not modify other files.
2. Code Analysis: Read target file contents and trace where they are imported before editing.
3. Guardrail: If you find bugs outside of scope or compile errors, stop and report immediately.
4. Self-Verification: Write basic unit tests to verify the correctness of the changes.
5. Provide evidence: Output code changes in <file_edit> blocks so they are applied to disk automatically.`;

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(buildPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-3xs">
            {activeStage === "PLAN" && (
                <PlanStage task={task} readOnly={readOnly} onAdvance={() => handleNextStage("BUILD")} />
            )}

            {activeStage === "BUILD" && (
                <BuildStage
                    buildPrompt={buildPrompt}
                    copied={copied}
                    readOnly={readOnly}
                    onCopyPrompt={handleCopyPrompt}
                    onAdvance={() => handleNextStage("VERIFY")}
                />
            )}

            {activeStage === "VERIFY" && (
                <VerifyStage
                    runner={runner}
                    onRunnerChange={setRunner}
                    runningAction={runningAction}
                    onRunAction={handleAction}
                    readOnly={readOnly}
                    onAdvance={() => handleNextStage("AUTOMATE")}
                />
            )}

            {activeStage === "AUTOMATE" && (
                <AutomateStage
                    onRunAction={handleAction}
                    readOnly={readOnly}
                    onAdvance={() => handleNextStage("OBSERVE")}
                />
            )}

            {activeStage === "OBSERVE" && (
                <ObserveStage
                    projectId={projectId}
                    taskId={task.id}
                    onTriggerLog={onTriggerLog}
                    readOnly={readOnly}
                    onAdvance={() => handleNextStage("LEARN")}
                />
            )}

            {activeStage === "LEARN" && (
                <LearnStage
                    projectId={projectId}
                    retroAnswers={retroAnswers}
                    onRetroAnswersChange={setRetroAnswers}
                    readOnly={readOnly}
                    onSubmit={handleRetroSubmit}
                />
            )}
        </div>
    );
}
