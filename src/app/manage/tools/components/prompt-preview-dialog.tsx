"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PromptPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  model?: string;
  prompt?: string;
  isLoading?: boolean;
};

export function PromptPreviewDialog({
  open,
  onOpenChange,
  label,
  model,
  prompt = "",
  isLoading = false,
}: PromptPreviewDialogProps) {
  const [didCopy, setDidCopy] = useState(false);

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setDidCopy(true);
      setTimeout(() => setDidCopy(false), 2000);
    } catch (err) {
      console.error("Failed to copy prompt:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[85vh] max-w-2xl overflow-hidden p-0 border border-slate-200 bg-white rounded-3xl shadow-2xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-50/80 via-white to-violet-500/[0.02] px-6 py-5 border-b border-slate-100">
          <DialogHeader className="mb-0 space-y-2">
            <div className="flex items-center gap-1.5 text-violet-600">
              <Sparkles className="size-3.5 text-violet-500 animate-pulse-slow" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-violet-600">AI Prompt Parameter</span>
            </div>
            <DialogTitle className="text-base font-bold text-slate-800 tracking-tight leading-none mt-1">
              {label}
            </DialogTitle>

            {/* Model Info Badge */}
            {model && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-500">Target Model:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700 border border-violet-100/80 shadow-2xs hover:bg-violet-100/50 transition-colors">
                  <img src="/images/icons/gemini-color.svg" className="size-3.5 shrink-0 animate-pulse-slow" alt="Gemini" /> {model}
                </span>
              </div>
            )}
          </DialogHeader>
        </div>

        {/* Content Area: Prompt Code Block (scrollable) + fixed footer */}
        <div className="flex flex-col flex-1 min-h-0 bg-slate-50/50 p-6 gap-4">
          {/* Code Block - inner body scrolls */}
          <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden">
            {/* Fixed syntax header bar */}
            <div className="flex items-center justify-between border-b border-slate-850 bg-slate-900/60 backdrop-blur-xs px-4 py-2 text-[9px] font-bold tracking-wider uppercase text-slate-400 font-sans rounded-t-xl shrink-0">
              <span>SYSTEM INSTRUCTIONS / SYSTEM PROMPT</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!prompt.trim()}
                className="h-6 gap-1 px-2.5 text-[10px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all rounded-md cursor-pointer"
              >
                {didCopy ? (
                  <Check className="size-3 text-emerald-400 animate-scale-in" />
                ) : (
                  <Copy className="size-3" />
                )}
                {didCopy ? "Copied" : "Copy"}
              </Button>
            </div>

            {/* Scrollable prompt body */}
            <div className="flex-1 overflow-y-auto p-4.5 min-h-[140px] custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2.5 text-slate-500 font-sans">
                  <div className="size-5.5 rounded-full border-2 border-slate-800 border-t-violet-500 animate-spin" />
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-400">Loading instructions…</span>
                </div>
              ) : prompt.trim() ? (
                <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-200 font-mono antialiased">
                  {prompt}
                </pre>
              ) : (
                <div className="py-10 text-center text-xs italic text-slate-500 font-sans">
                  No prompt instruction supplied
                </div>
              )}
            </div>
          </div>

          {/* Fixed footer tip */}
          <div className="shrink-0 rounded-xl border border-violet-100/70 bg-gradient-to-r from-violet-50/50 via-white to-indigo-50/20 px-4 py-3.5 text-[10.5px] leading-relaxed text-slate-600 font-medium shadow-3xs">
            <span className="text-violet-600 font-bold mr-1 inline-flex items-center gap-1"><Sparkles className="size-3 text-violet-500" /> How it works:</span>
            This custom instruction prompt is sent directly to the designated AI model to guide its analysis, generation, or extraction behavior dynamically during execution.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
