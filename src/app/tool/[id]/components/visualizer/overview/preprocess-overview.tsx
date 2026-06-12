"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Link2, Target, Terminal, Copy, Check, ExternalLink, FileJson, CheckCircle2, Cpu, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PreProcessResult {
  preview?: {
    startUrls?: string[] | { url: string }[];
    goal?: string;
    generatedSystemPrompt?: string;
    expectedOutputSchema?: {
      description?: string;
      example?: Record<string, unknown>;
    };
  };
  input?: {
    startUrls?: { url: string }[];
  };
  config?: {
    model?: string;
    prompt?: string;
  };
}

interface PreProcessOverviewProps {
  result: PreProcessResult;
}

export function PreProcessOverview({ result }: PreProcessOverviewProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSystem, setCopiedSystem] = useState(false);

  const preview = result.preview || {};
  const input = result.input || {};
  const config = result.config || {};

  const inputUrls = input.startUrls || [];

  // Normalize preview.startUrls - can be string[] or {url: string}[]
  const rawPreviewUrls = preview.startUrls || [];
  const previewUrls = rawPreviewUrls.map(item =>
    typeof item === 'string' ? { url: item } : item
  );

  const goal = preview.goal || "";
  const systemPrompt = preview.generatedSystemPrompt || "";
  const model = config.model || "";
  const promptTemplate = config.prompt || "";
  const schemaDescription = preview.expectedOutputSchema?.description || "";
  const schemaExample = preview.expectedOutputSchema?.example;

  const isGemini = model.toLowerCase().includes("gemini");

  const handleCopySystemPrompt = () => {
    if (systemPrompt) {
      navigator.clipboard.writeText(systemPrompt);
      setCopiedSystem(true);
      setTimeout(() => setCopiedSystem(false), 2000);
    }
  };

  const handleCopyPromptTemplate = () => {
    if (promptTemplate) {
      navigator.clipboard.writeText(promptTemplate);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const hasInput = inputUrls.length > 0;
  const hasConfig = Boolean(model || promptTemplate);
  const hasPreview = Boolean(goal || schemaDescription || systemPrompt || previewUrls.length > 0);

  return (
    <div className="bg-slate-50/60 p-2.5 xs:p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Simple Page Header */}
        <div className="flex flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-slate-200/40">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles className="size-5 text-emerald-600" />
              <span>Preprocessing Job Visualizer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Analyze configurations and guidelines structured by payload keys.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs shadow-emerald-500/10">
            <CheckCircle2 className="size-3.5" />
            <span>Success</span>
          </span>
        </div>

        {/* Group 1: Input parameters (result.input) */}
        {hasInput && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-slate-200/60 shadow-xs p-3.5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Database className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">Input Parameters</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Target URLs supplied for execution.</p>
                </div>
              </div>
              <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100/60">
                result.input
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link2 className="size-4 text-slate-400" />
                  <span className="text-xs text-slate-600 font-semibold">Targets Count</span>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-200/50 px-2.5 py-0.5 rounded-md border border-slate-300/20">
                  {inputUrls.length} {inputUrls.length === 1 ? "url" : "urls"}
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200/50 rounded-xl overflow-hidden bg-slate-50/20">
                {inputUrls.map((urlObj, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400 font-bold w-5 text-center select-none">
                      {idx + 1}
                    </span>
                    <a
                      href={urlObj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-brand font-semibold truncate hover:underline flex-1 min-w-0"
                    >
                      {urlObj.url}
                    </a>
                    <ExternalLink className="size-3 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Group 2: Configuration parameters (result.config) */}
        {hasConfig && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-slate-200/60 shadow-xs p-3.5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">Configuration Settings</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Settings and prompts used to guide the analysis.</p>
                </div>
              </div>
              <span className="text-[10px] font-sans font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100/60">
                result.config
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Model Info */}
              {model && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/60 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    LLM Analytics Model
                  </span>
                  <div className="flex items-center gap-2">
                    {isGemini ? (
                      <Image
                        src="/images/icons/gemini-color.svg"
                        alt="Gemini"
                        width={16}
                        height={16}
                        className="size-4 shrink-0 object-contain select-none"
                      />
                    ) : (
                      <Sparkles className="size-4 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">
                      {model}
                    </span>
                  </div>
                </div>
              )}

              {/* Prompt Template */}
              {promptTemplate && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Prompt Template Instruction
                    </span>
                    <button
                      onClick={handleCopyPromptTemplate}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                        copiedPrompt
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700 font-extrabold"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
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
                  <pre className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-sans text-slate-600 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-60 overflow-y-auto">
                    {promptTemplate}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Group 3: Preview parameters (result.preview) */}
        {hasPreview && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-slate-200/60 shadow-xs p-3.5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Sparkles className="size-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">Generation Preview</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Target analysis goals and generated runtime prompts.</p>
                </div>
              </div>
              <span className="text-[10px] font-sans font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100/60">
                result.preview
              </span>
            </div>

            <div className="space-y-4">
              {/* Goal */}
              {goal && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                    <Target className="size-3.5 text-brand" />
                    Target Analysis Goal
                  </span>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed pl-5 select-text">
                    {goal}
                  </p>
                </div>
              )}

              {/* Expected Output Schema */}
              {(schemaDescription || schemaExample) && (
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                    <FileJson className="size-3.5 text-indigo-500" />
                    Expected Output Schema
                  </span>

                  {schemaDescription && (
                    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 pl-5 select-text">
                      <p className="text-xs font-medium text-slate-650 leading-relaxed">
                        {schemaDescription}
                      </p>
                    </div>
                  )}

                  {schemaExample && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold block pl-1">
                        Example Output Structure:
                      </span>
                      <pre className="p-4 rounded-xl border border-indigo-200/60 bg-indigo-50/30 text-xs font-mono text-slate-700 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-80 overflow-y-auto">
                        {JSON.stringify(schemaExample, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Generated System Prompt */}
              {systemPrompt && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                      <Terminal className="size-3.5 text-slate-500" />
                      Generated System Prompt
                    </span>
                    <button
                      onClick={handleCopySystemPrompt}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                        copiedSystem
                          ? "bg-emerald-55 border-emerald-250 text-emerald-700 font-extrabold"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      {copiedSystem ? (
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
                  <pre className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-sans text-slate-600 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-60 overflow-y-auto">
                    {systemPrompt}
                  </pre>
                </div>
              )}

              {/* Preview Start URLs (Render if there are URLs in preview.startUrls but not in input.startUrls) */}
              {previewUrls.length > 0 && !hasInput && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                    <Link2 className="size-3.5 text-slate-500" />
                    Preview Start URLs
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-200/50 rounded-xl overflow-hidden bg-slate-50/20">
                    {previewUrls.map((urlObj, idx) => (
                      <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-400 font-bold w-5 text-center select-none">
                          {idx + 1}
                        </span>
                        <a
                          href={urlObj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-brand font-semibold truncate hover:underline flex-1 min-w-0"
                        >
                          {urlObj.url}
                        </a>
                        <ExternalLink className="size-3 text-slate-400 shrink-0" />
                      </div>
                    ))}
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
