"use client";

import { useRef } from "react";
import {
  BrainCircuit,
  Clock3,
  Sparkles,
  Plus,
  Loader2,
  ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ToolTestPromptResult } from "@/core/interfaces/tools.interface";

interface PromptInputFieldProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholderText?: string;
  onSend?: () => void;
  isSendLoading?: boolean;
  testResult?: ToolTestPromptResult | null;
  activeModel: string;
  error?: string;
  onActivityAccess?: () => void;
}

const ENABLE_PROMPT_IMPROVEMENT = false; // Toggle to true to enable "Improve Prompt (AI Sparkle)"

export function PromptInputField({
  id,
  value,
  onChange,
  placeholderText,
  onSend,
  isSendLoading,
  testResult,
  activeModel,
  error,
  onActivityAccess,
}: PromptInputFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const newValue = value ? `${value}\n\n${text}` : text;
        onChange(newValue);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset file selection
  };

  const modelLower = activeModel.toLowerCase();
  let modelIconSrc = "";
  if (modelLower.includes("gemini")) {
    modelIconSrc = "/images/icons/gemini-color.svg";
  } else if (modelLower.includes("claude")) {
    modelIconSrc = "/images/icons/claude-color.svg";
  }

  const len = value.length;
  const pill =
    len === 0
      ? {
        text: "Empty prompt",
        cls: "text-slate-400",
        dot: "bg-slate-300",
      }
      : len < 150
        ? {
          text: "Simple Scope",
          cls: "text-sky-600 bg-sky-50/45 border border-sky-100 px-2 py-0.5 rounded-md shadow-3xs",
          dot: "bg-sky-400",
        }
        : len < 500
          ? {
            text: "Balanced Query",
            cls: "text-emerald-600 bg-emerald-50/45 border border-emerald-100 px-2 py-0.5 rounded-md shadow-3xs",
            dot: "bg-emerald-500",
          }
          : {
            text: "Deep AI Analysis",
            cls: "text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md shadow-3xs animate-pulse",
            dot: "bg-violet-500",
          };

  return (
    <div className="space-y-1">
      {/* Hidden File Input for .txt and .md */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.md"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1.5 select-none">
        <div className="flex items-center gap-2">
          {/* Model Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-650 rounded-full border border-slate-200/50 transition-colors shadow-3xs cursor-default">
            {modelIconSrc ? (
              <img src={modelIconSrc} alt={activeModel} className="size-3.5 object-contain shrink-0" />
            ) : (
              <BrainCircuit className="size-3.5 text-brand" />
            )}
            <span>{activeModel}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Activity Access button */}
          {onActivityAccess && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full text-slate-450 hover:text-slate-755 hover:bg-slate-100/80 cursor-pointer"
              onClick={onActivityAccess}
              title="View History"
            >
              <Clock3 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ChatGPT-style Unified Capsule Container */}
      <div
        className={cn(
          "group/prompt relative border border-slate-200/80 bg-slate-50/15 focus-within:bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10 transition-all rounded-2xl flex flex-col shadow-[0_8px_30px_rgba(15,23,42,0.01)] overflow-hidden",
          error && "border-red-500 focus-within:ring-red-500/20 bg-red-50/10"
        )}
      >
        <Textarea
          id={id}
          placeholder={
            placeholderText ||
            "อยากให้ช่วยวิเคราะห์ข้อมูลแบบไหน บอกได้เลยนะครับ... (เช่น วิเคราะห์ทัศนคติ แยกแยะกลุ่มผู้ใช้ หรือ ค้นหาความเห็นเชิงบวก/เชิงลบ)"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "min-h-48 pb-2 pt-4 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 rounded-none px-5 resize-none shadow-none font-normal placeholder:text-slate-400 placeholder:opacity-85 text-slate-700 leading-relaxed text-sm whitespace-pre-wrap outline-none",
            ENABLE_PROMPT_IMPROVEMENT ? "pr-14" : "pr-5"
          )}
        />

        {/* Prompt Improvement (Sparkle) Button */}
        {ENABLE_PROMPT_IMPROVEMENT && (
          <button
            type="button"
            className="absolute top-3.5 right-4 p-1.5 rounded-lg text-slate-450 hover:text-brand hover:bg-brand/5 transition-all cursor-pointer z-10"
            title="Improve Prompt (AI Sparkle)"
          >
            <Sparkles className="size-4" />
          </button>
        )}

        {/* Embedded Bottom Controls Ribbon */}
        <div className="flex items-center justify-between bg-transparent px-5 pb-4 pt-1.5 select-none text-[10.5px] z-10 w-full shrink-0 flex-wrap gap-3">
          {/* Left Side: Attach Content Button & Complexity Pill */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Attach Content button */}
            <button
              type="button"
              onClick={handleAttachClick}
              className="flex items-center justify-center size-6.5 rounded-lg text-slate-450 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/50 hover:border-slate-300 transition-all cursor-pointer"
              title="Attach File (.txt, .md)"
            >
              <Plus className="size-3.5" />
            </button>

            {/* Complexity Indicator */}
            <span className={cn("flex items-center gap-1.5 font-bold", pill.cls)}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pill.dot)}></span>
              {pill.text}
            </span>

            {/* Micro Clear button */}
            {len > 0 && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1 text-slate-450 hover:text-rose-500 transition-colors font-bold bg-white border border-slate-200/60 hover:border-rose-100 px-2 py-0.5 rounded-md shadow-3xs hover:bg-rose-50/50 cursor-pointer pointer-events-auto"
              >
                Clear Prompt
              </button>
            )}
          </div>

          {/* Right Side: Circular Black Submit Button */}
          <div className="flex items-center gap-2.5 ml-auto">
            {onSend && (
              <button
                type="button"
                onClick={onSend}
                disabled={isSendLoading || value.trim().length === 0}
                className={cn(
                  "flex items-center justify-center size-8 rounded-full transition-all duration-200 shadow-sm select-none cursor-pointer border border-transparent shrink-0",
                  isSendLoading
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : value.trim().length === 0
                      ? "bg-slate-100/80 text-slate-300 border-slate-200/40 cursor-not-allowed"
                      : testResult?.success
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/10"
                        : "bg-slate-900 hover:bg-slate-850 text-white hover:scale-105 active:scale-95 shadow-md"
                )}
                title={testResult?.success ? "Run Tool Job" : "Test prompt instruction"}
              >
                {isSendLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4 text-white fill-none stroke-[2.5]" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Character Count text placed outside the capsule container, at the bottom right corner */}
      <div className="flex justify-end text-[10px] text-slate-400 font-normal select-none mt-1.5 pr-2">
        <span className="text-slate-550 font-normal">{len}</span> / 2,000 chars
      </div>
    </div>
  );
}
