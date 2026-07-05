"use client";

import React from "react";
import { GitWorkspace } from "./GitWorkspace";

interface ObserveStageProps {
    projectId: string;
    taskId: string;
    onTriggerLog: () => void;
    onAdvance: () => void;
}

export function ObserveStage({ projectId, taskId, onTriggerLog, onAdvance }: ObserveStageProps) {
    return (
        <div className="space-y-4">
            <GitWorkspace
                projectId={projectId}
                taskId={taskId}
                onTriggerLog={onTriggerLog}
            />

            <button
                onClick={onAdvance}
                className="w-full rounded-sm bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm"
            >
                Code Committed/Pushed & Advance to Learn
            </button>
        </div>
    );
}
