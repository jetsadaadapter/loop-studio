"use client";

import React from "react";
import { Sparkles, Check, Copy } from "lucide-react";

interface BuildStageProps {
    buildPrompt: string;
    copied: boolean;
    readOnly?: boolean;
    onCopyPrompt: () => void;
    onAdvance: () => void;
}

export function BuildStage({ buildPrompt, copied, readOnly = false, onCopyPrompt, onAdvance }: BuildStageProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-indigo-600 animate-pulse" />
                    <h3 className="font-semibold text-slate-800 text-sm">Stage 2 (Build): AI Prompter</h3>
                </div>

                <button
                    onClick={onCopyPrompt}
                    className="flex items-center gap-1 rounded-sm border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-3xs"
                >
                    {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    {copied ? "Copied!" : "Copy prompt template"}
                </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-lg">
                <pre className="font-sans text-2xs text-slate-700 leading-relaxed whitespace-pre-wrap select-all">
                    {buildPrompt}
                </pre>
            </div>

            <p className="text-xs text-slate-500 font-sans leading-normal">
                Tip: Somsri (Developer Agent) is assigned to this project. You can type instructions and Chat with Somsri in the Developer Space on the right to edit files automatically.
            </p>

            <button
                onClick={onAdvance}
                disabled={readOnly}
                className="w-full rounded-sm bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand"
            >
                Code Written & Advance to Verify
            </button>
            {readOnly && (
                <p className="text-center text-[10px] text-slate-400 font-sans">
                    Viewing history — this action only applies to the task&apos;s current stage.
                </p>
            )}
        </div>
    );
}
