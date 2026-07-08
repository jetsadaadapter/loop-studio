"use client";

import React, { useEffect, useState } from "react";
import { BookOpenText, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { KnowledgeEntry, RetroAnswers } from "@/core/interfaces/loop-projects.interface";

interface LearnStageProps {
    projectId: string;
    retroAnswers: RetroAnswers;
    onRetroAnswersChange: (answers: RetroAnswers) => void;
    onSubmit: (e: React.FormEvent) => void;
}

/** Read-only view of the project's accumulated learnings (newest first). */
function KnowledgePanel({ projectId }: { projectId: string }) {
    const [entries, setEntries] = useState<KnowledgeEntry[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/loop-projects/${projectId}/knowledge`)
            .then((res) => res.json())
            .then((json) => {
                if (!cancelled && json.success) setEntries(json.data.entries ?? []);
            })
            .catch(() => { /* panel is informational — stay empty on error */ });
        return () => { cancelled = true; };
    }, [projectId]);

    if (entries.length === 0) return null;

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5">
                <BookOpenText className="size-3.5 text-indigo-600" />
                <span className="text-[10px] font-semibold text-slate-700 font-sans">
                    Project knowledge — fed into every planner & AI-team run
                </span>
            </div>
            <ul className="space-y-1.5">
                {[...entries].reverse().slice(0, 5).map((e) => (
                    <li key={e.taskId} className="text-[10px] text-slate-600 font-sans">
                        <span className="font-semibold">{e.taskName}</span>
                        {" — "}
                        {e.learnings.join("; ")}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function LearnStage({ projectId, retroAnswers, onRetroAnswersChange, onSubmit }: LearnStageProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Stage 6 (Learn): Retrospective</h3>
            </div>

            <KnowledgePanel projectId={projectId} />

            <div className="space-y-3">
                <div>
                    <label className="block text-[10px] font-medium text-slate-600 font-sans mb-1">
                        1. Did the test cases actually prove correctness (or pass insignificantly)?
                    </label>
                    <Input
                        type="text"
                        required
                        value={retroAnswers.testsProven}
                        onChange={(e) => onRetroAnswersChange({ ...retroAnswers, testsProven: e.target.value })}
                        className="h-auto rounded-lg px-3 py-2 text-xs focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-medium text-slate-600 font-sans mb-1">
                        2. Are there any environments left unverified?
                    </label>
                    <Input
                        type="text"
                        required
                        value={retroAnswers.envVerified}
                        onChange={(e) => onRetroAnswersChange({ ...retroAnswers, envVerified: e.target.value })}
                        className="h-auto rounded-lg px-3 py-2 text-xs focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-medium text-slate-600 font-sans mb-1">
                        3. Did any unintended side-effects occur outside the scoped files?
                    </label>
                    <Input
                        type="text"
                        required
                        value={retroAnswers.sideEffects}
                        onChange={(e) => onRetroAnswersChange({ ...retroAnswers, sideEffects: e.target.value })}
                        className="h-auto rounded-lg px-3 py-2 text-xs focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="w-full rounded-sm bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm"
            >
                Submit Retro & Complete Task Loop
            </button>
        </form>
    );
}
