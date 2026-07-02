"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Sliders, Settings, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeStartUrls } from "../../../start-urls-utils";

interface TabInputStorageProps {
  job: ToolJob;
  mode?: "input";
}

export function TabInputStorage({ job }: TabInputStorageProps) {
  const [viewMode, setViewMode] = useState<"form" | "json">("form");
  const [copied, setCopied] = useState(false);


  const [copiedUrlIdx, setCopiedUrlIdx] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyUrl = (url: string, idx: number) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlIdx(idx);
    setTimeout(() => setCopiedUrlIdx(null), 2000);
  };

  const handleCopyKey = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const normalizedStartUrls = normalizeStartUrls(job.input?.startUrls);
  const hasStartUrls = normalizedStartUrls.length > 0;

  const inputEntries = Object.entries(job.input || {}).filter(
    ([key, val]) => 
      key.toLowerCase() !== "prompt" && 
      key.toLowerCase() !== "starturls" && 
      key.toLowerCase() !== "_preprocessconfig" &&
      val !== undefined && 
      val !== null && 
      val !== ""
  );
  const hasScalarInputs = inputEntries.some(([, val]) => typeof val !== "object");

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

  const isApify = Boolean(job.plugin?.toLowerCase().includes("apify"));

  const scalarConfigEntries = configEntries.filter(
    ([key, val]) => 
      typeof val !== "object" && 
      val !== undefined && 
      val !== null && 
      val !== "" && 
      key.toLowerCase() !== "prompt"
  );
  const promptConfigEntry = configEntries.find(([key]) => key.toLowerCase() === "prompt");
  const hasPromptConfig = promptConfigEntry && typeof promptConfigEntry[1] === "string" && !!promptConfigEntry[1];
  const hasRenderableConfig = scalarConfigEntries.length > 0 || !!hasPromptConfig;

  const renderScalarValue = (key: string, val: unknown) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "object") return null;

    const normalizedKey = key.toLowerCase();
    const isSpecialText = ["userinput", "userprompt", "task", "prompt"].includes(normalizedKey);
    const valStr = typeof val === "boolean" ? String(val) : String(val);
    const isUrl = !isSpecialText && (valStr.startsWith("http://") || valStr.startsWith("https://"));
    const isLongText = isSpecialText || (!isUrl && (valStr.length > 80 || valStr.includes("\n")));
    
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valStr);
    const isTechnicalId = !isSpecialText && !isUrl && (
      isUuid || 
      normalizedKey.includes("id") || 
      normalizedKey.includes("guid") || 
      normalizedKey.includes("token") || 
      normalizedKey.includes("key")
    );

    const useFullWidth = isLongText || (isUrl && valStr.length > 40);

    return (
      <div 
        key={`field-${key}`}
        className={cn("min-w-0", useFullWidth ? "col-span-full" : "col-span-1")}
      >
        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-450 font-sans block uppercase tracking-wider">{key}</span>
        {isUrl || isLongText || isTechnicalId ? (
          <div className={cn(
            "flex gap-2 bg-slate-50/50 border border-slate-200/60 rounded-lg p-1.5 px-2.5 mt-1.5 hover:border-slate-300 transition-all duration-150 shadow-2xs",
            isLongText ? "items-start group/long-input" : "items-center group/short-input"
          )}>
            <div className={cn("flex-1 min-w-0", isLongText ? "py-1" : "")}>
              {isLongText ? (
                <pre className="text-xs font-sans font-normal text-slate-700 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-60 overflow-y-auto wrap-break-word">
                  {valStr}
                </pre>
              ) : (
                <span className="block truncate select-text text-xs text-slate-700 font-sans">
                  {valStr}
                </span>
              )}
            </div>
            <div className={cn("flex items-center gap-1.5 shrink-0", isLongText ? "pt-0.5" : "")}>
              {isUrl && (
                <>
                  <a
                    href={valStr}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center size-6 text-slate-400 hover:text-slate-600 transition-all cursor-pointer active:scale-90"
                    title="Open link in new window"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
                </>
              )}
              <button
                onClick={() => handleCopyKey(valStr, key)}
                className={cn(
                  "flex items-center justify-center size-6 transition-all active:scale-90 cursor-pointer",
                  copiedKey === key
                    ? "text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
                title="Copy to clipboard"
                type="button"
              >
                {copiedKey === key ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs font-normal text-slate-700 mt-1.5 block leading-relaxed whitespace-pre-wrap wrap-break-word">
            {valStr}
          </span>
        )}
      </div>
    );
  };

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
          <div className="relative rounded-xl border border-slate-200 bg-white shadow-xs w-full overflow-hidden flex flex-col">
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
            <pre className="p-5 overflow-auto font-sans text-xs leading-relaxed text-slate-655 select-text pr-16 sm:pr-28">
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
              <div className="bg-white border border-slate-200/60 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-750 flex items-center gap-2 uppercase tracking-wider">
                  <Sliders className="size-4 text-indigo-650" />
                  <span>Execution Input Arguments</span>
                </h3>

                {hasScalarInputs && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inputEntries.map(([key, val]) => renderScalarValue(key, val))}
                  </div>
                )}

                {/* Prompt specialized copy box */}
                {hasInputPrompt && promptKey && (
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    {renderScalarValue(promptKey, promptVal)}
                  </div>
                )}

                {/* Start URLs specialized rendering */}
                {hasStartUrls && (
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-450 font-sans block uppercase tracking-wider">startUrls (Targets)</span>
                    <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                      {normalizedStartUrls.map((url, idx) => {
                        const isCopied = copiedUrlIdx === idx;
                        return (
                          <div 
                            key={`url-${idx}`} 
                            className="flex items-center gap-2 bg-slate-50/50 border border-slate-200/60 p-1.5 px-2.5 rounded-lg text-xs font-sans text-slate-700 group/url shadow-2xs hover:border-slate-300 transition-all duration-150"
                          >
                            <span className="flex-1 truncate select-text min-w-0">
                              {url}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {url && (
                                <>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center size-6 text-slate-400 hover:text-slate-600 transition-all cursor-pointer active:scale-90"
                                    title="Open link in new window"
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                  <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
                                </>
                              )}
                              <button
                                onClick={() => handleCopyUrl(url, idx)}
                                className={cn(
                                  "flex items-center justify-center size-6 transition-all active:scale-90 cursor-pointer",
                                  isCopied
                                    ? "text-emerald-600"
                                    : "text-slate-400 hover:text-slate-600"
                                )}
                                title="Copy to clipboard"
                                type="button"
                              >
                                {isCopied ? (
                                  <Check className="size-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section: Actor Configuration */}
            {hasRenderableConfig && (
              <div className="bg-white border border-slate-200/60 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-750 flex items-center gap-2 uppercase tracking-wider">
                  <Settings className="size-4 text-purple-650" />
                  <span>{isApify ? "Actor Engine Settings" : "Settings"}</span>
                </h3>
                {scalarConfigEntries.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scalarConfigEntries.map(([key, val]) => renderScalarValue(key, val))}
                  </div>
                )}

                {/* Prompt specialized bottom copy box */}
                {(() => {
                  const promptEntry = configEntries.find(([key]) => key.toLowerCase() === "prompt");
                  if (promptEntry) {
                    const [key, val] = promptEntry;
                    if (typeof val === "string" && val) {
                      return (
                        <div className="border-t border-slate-100 pt-4 mt-2">
                          {renderScalarValue(key, val)}
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
