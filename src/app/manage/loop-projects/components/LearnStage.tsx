"use client";

import React from "react";
import { GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RetroAnswers } from "@/core/interfaces/loop-projects.interface";

interface LearnStageProps {
    retroAnswers: RetroAnswers;
    onRetroAnswersChange: (answers: RetroAnswers) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function LearnStage({ retroAnswers, onRetroAnswersChange, onSubmit }: LearnStageProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Stage 6 (Learn): Retrospective</h3>
            </div>

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
                className="w-full rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm"
            >
                Submit Retro & Complete Task Loop
            </button>
        </form>
    );
}
