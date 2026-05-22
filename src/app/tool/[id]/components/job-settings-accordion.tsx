"use client";

import { useState } from "react";
import { Settings, ChevronDown, ChevronUp, Copy, Check, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

type JobSettingsAccordionProps = {
  configActorId: string;
  configModelWithFallback: string;
  configItemKey: string;
  hasItemKey: boolean;
  configPrompt: string;
  copiedPrompt: boolean;
  onCopyPrompt: () => void;
  otherParams: Array<[string, unknown]>;
};

export function JobSettingsAccordion({
  configActorId,
  configModelWithFallback,
  configItemKey,
  hasItemKey,
  configPrompt,
  copiedPrompt,
  onCopyPrompt,
  otherParams,
}: JobSettingsAccordionProps) {
  const [showConfig, setShowConfig] = useState(false);
  const metadataColsCount = hasItemKey ? 2 : 1;

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowConfig(!showConfig)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Settings className="size-3.5 text-slate-500 animate-spin-slow" />
          <span className="text-[11px] font-bold text-slate-700">
            {configActorId
              ? "Inspect Apify Scraper Run Parameters"
              : "Inspect AI Run Parameters & Prompt Template"}
          </span>
        </div>
        {showConfig ? (
          <ChevronUp className="size-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="size-3.5 text-slate-400" />
        )}
      </button>

      {showConfig && (
        <div className="p-3.5 bg-white space-y-3.5 text-xs">
          <div
            className={cn(
              "grid gap-2 pb-2.5 border-b border-slate-100",
              metadataColsCount === 2 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                Model Configuration
              </span>
              <span className="font-semibold text-slate-800 text-[10.5px] break-all">
                {configModelWithFallback}
              </span>
            </div>
            {hasItemKey && (
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                  Item Key Mapping
                </span>
                <span className="font-semibold text-slate-800 text-[10.5px]">
                  {configItemKey}
                </span>
              </div>
            )}
          </div>

          {configPrompt && (
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                System Prompt Template
              </span>
              <div className="relative group rounded-xl bg-slate-950 p-4 pr-24 text-[10.5px] text-slate-200 overflow-x-auto max-h-[140px] overflow-y-auto leading-relaxed border border-slate-800 whitespace-pre-wrap select-text">
                {configPrompt}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyPrompt();
                  }}
                  className={cn(
                    "absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                    copiedPrompt
                      ? "bg-emerald-950/80 border-emerald-800 text-emerald-400 font-extrabold animate-in fade-in zoom-in-95 duration-150"
                      : "bg-slate-900/90 border-slate-800 hover:bg-slate-800/90 text-slate-400 hover:text-slate-200"
                  )}
                  title="Copy Prompt"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="size-3 text-emerald-400 animate-bounce" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {configActorId && !configPrompt && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                Apify Actor Integration
              </span>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-100/70 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
                <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm shrink-0">
                  <Cpu className="size-3.5 animate-pulse" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-bold text-amber-700 tracking-wide uppercase block">
                    Data Scraper Provider
                  </span>
                  <span className="font-bold text-slate-800 text-[11px] block truncate">
                    {configActorId}
                  </span>
                  <p className="text-[9.5px] text-slate-500 leading-normal">
                    This task executed an external Apify automation cloud actor
                    to extract post engagement statistics directly from social
                    targets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {otherParams.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                Task Runtime Parameters
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100">
                {otherParams.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-0.5 min-w-0 text-[9.5px]"
                  >
                    <span className="text-slate-500 font-medium truncate mr-2 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="font-bold text-slate-700 shrink-0 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md shadow-xs">
                      {typeof val === "boolean"
                        ? val
                          ? "True"
                          : "False"
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
