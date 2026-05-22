"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Sliders, Settings, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabInputStorageProps {
  job: ToolJob;
  mode?: "input";
}

export function TabInputStorage({ job }: TabInputStorageProps) {
  const [viewMode, setViewMode] = useState<"form" | "json">("form");
  const [copied, setCopied] = useState(false);
  const [copiedInputPrompt, setCopiedInputPrompt] = useState(false);
  const [copiedConfigPrompt, setCopiedConfigPrompt] = useState(false);

  // Safe resolve configuration
  let resolvedConfig: Record<string, unknown> = {};
  try {
    if (job.config) {
      resolvedConfig = typeof job.config === 'string' ? JSON.parse(job.config as string) : (job.config as Record<string, unknown>);
    }
  } catch {
    resolvedConfig = (job.config as Record<string, unknown>) || {};
  }

  // Collect all input properties
  const promptKey = Object.keys(job.input || {}).find(k => k.toLowerCase() === "prompt");
  const promptVal = promptKey ? job.input?.[promptKey] : undefined;
  const hasInputPrompt = typeof promptVal === "string" && !!promptVal;

  const hasStartUrls = Array.isArray(job.input?.startUrls) && job.input.startUrls.length > 0;

  const inputEntries = Object.entries(job.input || {}).filter(
    ([key]) => key.toLowerCase() !== "prompt" && key.toLowerCase() !== "starturls"
  );
  const hasScalarInputs = inputEntries.some(([_, val]) => typeof val !== "object" && val !== undefined && val !== null);

  const hasAnyInput = hasScalarInputs || hasInputPrompt || hasStartUrls;

  const configEntries = Object.entries(resolvedConfig);

  const jsonStr = JSON.stringify(job.input || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        cls = "text-slate-400 font-medium"; // null
      }

      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <div className="flex-1 h-full min-h-0 bg-slate-50 p-6 flex flex-col select-none overflow-hidden">
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
                onClick={handleCopy}
                size="sm"
                variant="ghost"
                className="h-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md text-xs font-semibold px-3 gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs animate-in fade-in duration-200"
              >
                {copied ? (
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
            <pre className="font-mono text-xs leading-relaxed text-slate-655 select-text pr-28">
              <code
                dangerouslySetInnerHTML={{ __html: highlightJson(jsonStr) }}
                className="block whitespace-pre"
              />
            </pre>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Section: Start Parameters */}
            {hasAnyInput && (
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-750 flex items-center gap-2 uppercase tracking-wider">
                  <Sliders className="size-4 text-indigo-650" />
                  <span>Execution Input Arguments</span>
                </h3>

                {hasScalarInputs && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inputEntries.map(([key, val]) => {
                      if (typeof val === "object") return null; // skip startUrls and complex arrays
                      return (
                        <div key={`input-${key}`}>
                          <span className="text-[10px] font-bold text-slate-450 font-mono block uppercase">{key}</span>
                          <span className="text-xs font-semibold text-slate-750 mt-1 block">
                            {typeof val === "boolean" ? String(val) : String(val || "-")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Prompt specialized copy box */}
                {hasInputPrompt && (
                  <div className="border-t border-slate-100 pt-4 mt-2 space-y-2">
                    <span className="text-[10px] font-bold text-slate-450 font-mono block uppercase">{promptKey}</span>
                    <div className="relative group/prompt rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 transition-all duration-200 shadow-xs hover:border-slate-350">
                      <pre className="p-4 pr-24 text-xs font-sans font-semibold text-slate-700 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-60 overflow-y-auto">
                        {promptVal}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(promptVal));
                          setCopiedInputPrompt(true);
                          setTimeout(() => setCopiedInputPrompt(false), 2000);
                        }}
                        className={cn(
                          "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                          copiedInputPrompt
                            ? "bg-emerald-50 border-emerald-250 text-emerald-700 font-extrabold"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                        )}
                        type="button"
                      >
                        {copiedInputPrompt ? (
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

                {/* Start URLs specialized rendering */}
                {hasStartUrls && (
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-450 font-mono block uppercase">startUrls (Targets)</span>
                    <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                      {(job.input.startUrls as { url?: string }[]).map((item, idx) => (
                        <div key={`url-${idx}`} className="bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-650 truncate">
                          {item.url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section: Actor Configuration */}
            {configEntries.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-750 flex items-center gap-2 uppercase tracking-wider">
                  <Settings className="size-4 text-purple-650" />
                  <span>Actor Engine Settings</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {configEntries.map(([key, val]) => {
                    if (typeof val === "object") return null;
                    if (key.toLowerCase() === "prompt") return null; // skip prompt from top grid

                    return (
                      <div key={`config-${key}`}>
                        <span className="text-[10px] font-bold text-slate-450 font-mono block uppercase">{key}</span>
                        <span className="text-xs font-semibold text-slate-750 mt-1 block">
                          {String(val || "-")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Prompt specialized bottom copy box */}
                {(() => {
                  const promptEntry = configEntries.find(([key]) => key.toLowerCase() === "prompt");
                  if (promptEntry) {
                    const [key, val] = promptEntry;
                    if (typeof val === "string" && val) {
                      return (
                        <div className="border-t border-slate-100 pt-4 mt-2 space-y-2">
                          <span className="text-[10px] font-bold text-slate-450 font-mono block uppercase">{key}</span>
                          <div className="relative group/prompt-config rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 transition-all duration-200 shadow-xs hover:border-slate-350">
                            <pre className="p-3.5 pr-24 text-xs font-sans font-semibold text-slate-700 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-40 overflow-y-auto">
                              {val}
                            </pre>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(String(val));
                                setCopiedConfigPrompt(true);
                                setTimeout(() => setCopiedConfigPrompt(false), 2000);
                              }}
                              className={cn(
                                "absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                                copiedConfigPrompt
                                  ? "bg-emerald-50 border-emerald-250 text-emerald-700 font-extrabold"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                              )}
                              type="button"
                            >
                              {copiedConfigPrompt ? (
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
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
