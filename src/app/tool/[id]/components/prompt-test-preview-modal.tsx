"use client";

import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Copy,
  Check,
  Link2,
  Target,
  FileText,
  Braces,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolTestPromptResult } from "@/core/interfaces/tools.interface";

interface PromptTestPreviewModalProps {
  testResult: ToolTestPromptResult;
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onRun: () => void;
}

type StepType = "urls" | "goal" | "prompt" | "schema";

const STEPS: { id: StepType; label: string }[] = [
  { id: "urls", label: "Target URLs" },
  { id: "goal", label: "Goal Analysis" },
  { id: "prompt", label: "Generated Prompt" },
  { id: "schema", label: "Output Schema" },
];

const STEP_ICONS: Record<StepType, LucideIcon> = {
  urls: Link2,
  goal: Target,
  prompt: FileText,
  schema: Braces,
};

export function PromptTestPreviewModal({
  testResult,
  isOpen,
  onClose,
  onRetry,
  onRun,
}: PromptTestPreviewModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen || !testResult.success || !testResult.result) return null;

  const { result } = testResult;
  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(
      String(result.preview.generatedSystemPrompt || ""),
    );
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleRetry = () => {
    onRetry();
    onClose();
  };

  const handleRun = () => {
    onRun();
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "urls":
        return (
          <div className="space-y-3">
            {result.preview?.startUrls && result.preview.startUrls.length > 0 ? (
              <ul className="space-y-2">
                {result.preview.startUrls.map((url: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 p-3 bg-slate-50/60 border border-slate-150/60 rounded-lg hover:bg-slate-50 transition-colors min-w-0"
                  >
                    <span className="text-xs font-semibold text-slate-400 mt-0.5 min-w-fit">
                      #{i + 1}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title={url}
                      className="block min-w-0 flex-1 truncate whitespace-nowrap text-xs font-normal text-slate-700 hover:text-brand hover:underline transition-colors"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No URLs provided</p>
            )}
          </div>
        );

      case "goal":
        return (
          <div className="space-y-3">
            {typeof result.preview.goal === "string" ? (
              <p className="text-xs font-normal text-slate-700 leading-relaxed bg-linear-to-br from-slate-50/80 to-slate-50/40 p-4 rounded-lg border border-slate-150/60 shadow-inner shadow-slate-100/20">
                {result.preview.goal as string}
              </p>
            ) : (
              <p className="text-xs text-slate-500">No goal defined</p>
            )}
          </div>
        );

      case "prompt":
        return (
          <div className="space-y-3">
            {typeof result.preview.generatedSystemPrompt === "string" ? (
              <div className="relative group/prompt rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all duration-200 hover:border-slate-250">
                <pre className="p-4 pr-12 text-xs font-sans text-slate-700 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-96 overflow-y-auto">
                  {result.preview.generatedSystemPrompt as string}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={cn(
                    "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs",
                    copiedPrompt
                      ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800",
                  )}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No system prompt generated</p>
            )}
          </div>
        );

      case "schema":
        return (
          <div className="space-y-3">
            {result.preview.expectedOutputSchema !== undefined &&
            result.preview.expectedOutputSchema !== null ? (
              (() => {
                const schema = result.preview.expectedOutputSchema;
                const hasDescription =
                  typeof schema === "object" &&
                  schema !== null &&
                  "description" in schema;
                const descriptionText = hasDescription
                  ? String((schema as { description?: unknown }).description || "")
                  : "";

                return (
                  <>
                    {hasDescription ? (
                      <p className="text-xs font-normal text-slate-700 leading-relaxed bg-linear-to-br from-slate-50/80 to-slate-50/40 p-4 rounded-lg border border-slate-150/60 shadow-inner shadow-slate-100/20">
                        {descriptionText}
                      </p>
                    ) : (
                      <pre className="bg-slate-50/60 border border-slate-150/60 rounded-lg p-4 font-sans text-xs text-slate-700 leading-relaxed overflow-x-auto max-h-96 overflow-y-auto shadow-inner">
                        {typeof schema === "object"
                          ? JSON.stringify(schema, null, 2)
                          : String(schema)}
                      </pre>
                    )}
                  </>
                );
              })()
            ) : (
              <p className="text-xs text-slate-500">No output schema defined</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-7 py-4 border-b border-slate-100/60 bg-linear-to-r from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-brand/10 to-indigo-100/10 rounded-lg">
              <div className="w-4 h-4 bg-linear-to-br from-brand to-indigo-600 rounded animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
                Verify Prompt Configuration
              </h2>
              <p className="text-xs font-normal text-slate-500">Review and confirm before running</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            title="Close preview"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-linear-to-b from-slate-50/70 to-white border-b border-slate-100/60">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {STEPS.map((step, index) => {
              const StepIcon = STEP_ICONS[step.id];
              return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(index)}
                className={cn(
                  "group w-full text-left rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 transition-all duration-200",
                  index === currentStepIndex
                    ? "border-brand/30 bg-brand/5 shadow-[0_8px_24px_rgba(194,0,25,0.08)]"
                    : index < currentStepIndex
                      ? "border-emerald-200/70 bg-emerald-50/70 hover:border-emerald-300/80"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex items-center justify-center size-8 rounded-full text-sm font-semibold transition-colors shrink-0",
                      index === currentStepIndex
                        ? "bg-brand text-white"
                        : index < currentStepIndex
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200/80 text-slate-600 group-hover:bg-slate-300",
                    )}
                  >
                    <StepIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Step {index + 1}</p>
                    <p
                      className={cn(
                        "text-xs leading-tight font-semibold truncate",
                        index === currentStepIndex
                          ? "text-brand"
                          : index < currentStepIndex
                            ? "text-emerald-700"
                            : "text-slate-600",
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-6">
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.16em]">
              {currentStep.label}
            </h3>
            <div className="h-1 w-12 bg-linear-to-r from-brand to-indigo-600 rounded-full" />
          </div>
          {renderStepContent()}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100/60 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={cn(
                "flex h-8 items-center gap-1.5 px-4 rounded-sm text-sm font-semibold transition-all border",
                currentStepIndex === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95",
              )}
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === STEPS.length - 1}
              className={cn(
                "flex h-8 items-center gap-1.5 px-4 rounded-sm text-sm font-semibold transition-all border",
                currentStepIndex === STEPS.length - 1
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95",
              )}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetry}
              className="flex h-8 items-center gap-1.5 px-4 rounded-sm text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
            >
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">Edit Prompt</span>
            </button>

            <button
              onClick={handleRun}
              className="flex h-8 items-center gap-1.5 px-4 rounded-sm text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-600/90 transition-all active:scale-95 shadow-sm hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)] border border-transparent"
            >
              <Play className="size-4 fill-white" />
              <span>Run Tool</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
