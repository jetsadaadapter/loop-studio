"use client";

import { Sparkles } from "lucide-react";
import type { ToolTestPromptResult } from "@/core/interfaces/tools.interface";

interface PromptTestPreviewProps {
  testResult: ToolTestPromptResult;
}

export function PromptTestPreview({ testResult }: PromptTestPreviewProps) {
  if (!testResult.success || !testResult.result) return null;

  const { result } = testResult;

  return (
    <div className="mt-6 p-6 rounded-2xl bg-white border border-slate-200/60 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-sm hover:border-slate-300 space-y-6">
      {/* Left Stripe Accent */}
      <div className="bg-gradient-to-b from-brand to-indigo-650 absolute left-0 top-0 bottom-0 w-1.5" />

      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 pl-2">
        <Sparkles className="size-4.5 text-brand animate-pulse" />
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Generated Prompt Preview
        </h4>
        <span className="ml-auto rounded-full bg-emerald-500 text-white text-[9px] font-bold px-2.5 py-0.5 shadow-sm shadow-emerald-500/20 uppercase select-none">
          SUCCESSFULLY TESTED
        </span>
      </div>

      <div className="space-y-5 pl-2">
        {/* Target URLs Section */}
        {result.urls && result.urls.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Target URLs
            </span>
            <ul className="space-y-1.5 pl-4 border-l-2 border-slate-200/80">
              {result.urls.map((url: string, i: number) => (
                <li key={i} className="text-xs font-semibold text-slate-650 truncate hover:text-brand transition-colors">
                  <a href={url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Goal Section */}
        {typeof result.goal === "string" && (
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Goal Analysis
            </span>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-150/60 shadow-inner shadow-slate-100/50">
              {result.goal as string}
            </p>
          </div>
        )}

        {/* System Prompt Section */}
        {typeof result.generatedSystemPrompt === "string" && (
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Generated System Prompt
            </span>
            <div className="relative group/prompt">
              <pre className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs font-sans font-medium text-slate-650 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner">
                {result.generatedSystemPrompt as string}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(String(result.generatedSystemPrompt || ""));
                }}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover/prompt:opacity-100 focus:opacity-100 transition-opacity bg-white border border-slate-200 text-[10px] text-slate-700 font-bold px-2.5 py-1 rounded-lg shadow-xs active:scale-95 cursor-pointer hover:bg-slate-50 flex items-center gap-1"
              >
                Copy Prompt
              </button>
            </div>
          </div>
        )}

        {/* Expected Output Schema Section */}
        {result.expectedOutputSchema !== undefined && result.expectedOutputSchema !== null && (() => {
          const schema = result.expectedOutputSchema;
          const hasDescription = typeof schema === "object" && schema !== null && "description" in schema;
          const descriptionText = hasDescription ? String((schema as { description?: unknown }).description || "") : "";

          return (
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Expected Output Schema
              </span>
              {hasDescription ? (
                <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-150/60 shadow-inner shadow-slate-100/50">
                  {descriptionText}
                </p>
              ) : (
                <pre className="bg-slate-50 border border-slate-150 rounded-xl p-4 font-sans text-xs text-slate-650 leading-relaxed overflow-x-auto max-h-60 overflow-y-auto shadow-inner">
                  {typeof schema === "object"
                    ? JSON.stringify(schema, null, 2)
                    : String(schema)}
                </pre>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
