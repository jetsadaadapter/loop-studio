"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Copy, Check } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import type { ToolJob } from "../../../../../core/interfaces/tools.interface";
import { Button } from "../../../../../components/ui/button";

interface TabPreProcessProps {
  job: ToolJob;
}

export function TabPreProcess({ job }: TabPreProcessProps) {
  const [viewMode, setViewMode] = useState<"form" | "json">("form");
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const preProcessConfig = (job.input?._preProcessConfig || (job.result as Record<string, unknown> | undefined)?.config) as { model?: string; prompt?: string } | undefined;
  
  if (!preProcessConfig) {
    return (
      <div className="flex-1 h-full min-h-0 bg-slate-50 p-6 flex flex-col items-center justify-center text-slate-400 select-none overflow-hidden">
        <Sparkles className="size-8 text-slate-350 mb-2" />
        <p className="text-sm font-semibold text-slate-600">No AI Pre-processing configurations found.</p>
        <p className="text-xs text-slate-400 mt-1">This run executed directly without AI preprocessing.</p>
      </div>
    );
  }

  const jsonStr = JSON.stringify(preProcessConfig, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyPrompt = () => {
    if (preProcessConfig.prompt) {
      navigator.clipboard.writeText(preProcessConfig.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  // Safe and super clean HTML syntax highlighter for JSON
  const highlightJson = (json: string) => {
    if (!json) return "";

    const escaped = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

    return escaped.replace(regex, (match) => {
      let cls = "text-amber-700"; // default: number

      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-indigo-650 font-semibold"; // key
        } else {
          cls = "text-emerald-700"; // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-rose-600 font-bold"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-slate-400 font-bold"; // null
      }

      return `<span class="${cls}">${match}</span>`;
    });
  };

  const modelLower = preProcessConfig.model?.toLowerCase() || "";
  const isGemini = modelLower.includes("gemini");

  return (
    <div className="flex-1 h-full min-h-0 bg-slate-50 p-3 sm:p-6 flex flex-col select-none overflow-hidden">
      {/* View Mode Toggle (Top Left) */}
      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 self-start mb-5 shrink-0">
        <button
          onClick={() => setViewMode("form")}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
            viewMode === "form" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Form
        </button>
        <button
          onClick={() => setViewMode("json")}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
            viewMode === "json" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          )}
        >
          JSON
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto min-h-0">
        {viewMode === "json" ? (
          <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-xs w-full overflow-auto">
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={handleCopyJson}
                size="sm"
                variant="ghost"
                className="h-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md text-xs font-semibold px-3 gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs animate-in fade-in duration-200"
              >
                {copiedJson ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-slate-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </Button>
            </div>
            <pre className="font-sans text-xs leading-relaxed text-slate-655 select-text pr-16 sm:pr-28">
              <code
                dangerouslySetInnerHTML={{ __html: highlightJson(jsonStr) }}
                className="block whitespace-pre"
              />
            </pre>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="bg-white border border-slate-200/60 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 sm:space-y-5">
              <h3 className="text-xs font-bold text-slate-755 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles className="size-4 text-emerald-600 animate-pulse" />
                <span>AI Pre-processing Agent Settings</span>
              </h3>

              {preProcessConfig.model && (
                <div className="space-y-2">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-405 font-sans block uppercase tracking-wider">
                    LLM Analytics Model
                  </span>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg select-none">
                    {isGemini ? (
                      <Image
                        src="/images/icons/gemini-color.svg"
                        alt="Gemini"
                        width={14}
                        height={14}
                        className="size-3.5 shrink-0 object-contain select-none animate-pulse"
                      />
                    ) : (
                      <Sparkles className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-750 font-sans">
                      {preProcessConfig.model}
                    </span>
                  </div>
                </div>
              )}

              {preProcessConfig.prompt && (
                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-405 font-sans block uppercase tracking-wider">
                    Analyst System Prompt & Instructions
                  </span>
                  <div className="relative group/prompt-preprocess rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 transition-all duration-200 shadow-xs hover:border-slate-350">
                    <pre className="p-3 sm:p-4 pr-16 sm:pr-24 text-xs font-sans font-normal text-slate-600 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-96 overflow-y-auto">
                      {preProcessConfig.prompt}
                    </pre>
                    <button
                      onClick={handleCopyPrompt}
                      className={cn(
                        "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                        copiedPrompt
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700 font-extrabold"
                          : "bg-white border-slate-250 hover:bg-slate-50 text-slate-650 hover:text-slate-800"
                      )}
                      type="button"
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
