"use client";

import React from "react";
import { GitWorkspace } from "./GitWorkspace";

interface ObserveStageProps {
    projectId: string;
    taskId: string;
    onTriggerLog: () => void;
    readOnly?: boolean;
    onAdvance: () => void;
}

export function ObserveStage({ projectId, taskId, onTriggerLog, readOnly = false, onAdvance }: ObserveStageProps) {
    return (
        <div className="space-y-4">
            <GitWorkspace
                projectId={projectId}
                taskId={taskId}
                onTriggerLog={onTriggerLog}
            />

            <button
                onClick={onAdvance}
                disabled={readOnly}
                className="w-full rounded-sm bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand"
            >
                Code Committed/Pushed & Advance to Learn
            </button>
            {readOnly && (
                <p className="text-center text-[10px] text-slate-400 font-sans">
                    Viewing history — this action only applies to the task&apos;s current stage.
                </p>
            )}
        </div>
    );
}
