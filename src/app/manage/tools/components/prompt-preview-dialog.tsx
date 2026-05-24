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
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0 border border-slate-200 bg-white rounded-3xl shadow-2xl">
        {/* Header Section */}
        <div className="bg-linear-to-r from-slate-50 via-white to-brand/[0.03] px-5 py-4.5 border-b border-slate-100">
          <DialogHeader className="mb-0 space-y-2">
            <div className="flex items-center gap-2 text-brand">
              <Sparkles className="size-4 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">AI Prompt Parameter</span>
            </div>
            <DialogTitle className="text-base font-bold text-slate-800 tracking-tight leading-none mt-1">
              {label}
            </DialogTitle>

            {/* Model Info Badge */}
            {model && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-500">Target Model:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/5 px-2.5 py-0.5 text-[10px] font-semibold text-brand border border-brand/10 shadow-2xs">
                  🤖 {model}
                </span>
              </div>
            )}
          </DialogHeader>
        </div>

        {/* Content Section - Prompt Editor Display */}
        <div className="flex flex-col max-h-[58vh] overflow-y-auto bg-slate-50 p-5 gap-3.5">
          <div className="relative group/code flex flex-col rounded-xl border border-slate-200/80 bg-slate-900 shadow-md">
            {/* Syntax header action bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2 text-[10px] font-semibold text-slate-400 font-mono rounded-t-xl">
              <span>SYSTEM INSTRUCTIONS / SYSTEM PROMPT</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!prompt.trim()}
                className="h-6 gap-1 px-2 text-[10px] text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
              >
                {didCopy ? (
                  <Check className="size-3 text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
                {didCopy ? "Copied" : "Copy"}
              </Button>
            </div>

            {/* Code Body Container */}
            <div className="p-4 overflow-x-auto max-h-[42vh] scrollbar-thin flex flex-col justify-center min-h-[120px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400 font-mono">
                  <div className="size-5 rounded-full border-2 border-slate-700 border-t-brand animate-spin" />
                  <span className="text-[9px] tracking-wider uppercase">Loading instructions…</span>
                </div>
              ) : prompt.trim() ? (
                <pre className="whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-200 font-mono antialiased">
                  {prompt}
                </pre>
              ) : (
                <div className="py-6 text-center text-xs italic text-slate-500 font-mono">
                  No prompt instruction supplied
                </div>
              )}
            </div>
          </div>

          {/* Prompt parameter usage tip */}
          <div className="rounded-xl border border-brand/10 bg-brand/[0.02] px-3.5 py-2.5 text-[10.5px] leading-relaxed text-slate-600 font-medium">
            <span className="text-brand font-bold mr-1">💡 How it works:</span>
            This custom instruction prompt is sent directly to the designated AI model to guide its analysis, generation, or extraction behavior dynamically during execution.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
