"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Activity,
  Database,
  Quote,
  Sun,
  Moon,
  Info,
  BadgeCheck,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import {
  type ScrapedJobItem,
  type AnalysisResult,
  getAnalysisClassificationLabel,
  formatAnalysisConfidence,
  getAnalysisDisplayBlocks,
  type IntentAnalysisPostGroup,
  type AnalysisDisplayPreset,
} from "../../../tool-job-utils";

interface SlidePresentationViewProps {
  items: ScrapedJobItem[];
  intentGroups: IntentAnalysisPostGroup[];
  displayedSummaryText?: string;
  isSingleTextSummary?: boolean;
  schemaHintKeys?: string[];
  analysisDisplayPreset?: AnalysisDisplayPreset;
  job: ToolJob;
  onBack: () => void;
}

export function SlidePresentationView({
  items,
  intentGroups,
  displayedSummaryText,
  isSingleTextSummary = false,
  schemaHintKeys = [],
  analysisDisplayPreset,
  job,
  onBack,
}: SlidePresentationViewProps) {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const jobId = job.jobId || job.id || (job as unknown as Record<string, unknown>)._id as string | undefined || "";
  const shortId = jobId ? jobId.split("-")[0].slice(0, 8).toUpperCase() : "N/A";

  const handleToggleFullscreen = () => {
    const el = document.getElementById("slide-presentation-root");
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Take the first item with analysis for structured data
  const firstAnalyzedItem = items.find((item) => item.analysis);
  const analysis = firstAnalyzedItem?.analysis as AnalysisResult | undefined;

  const summary = analysis?.summary_of_intent || analysis?.summary || displayedSummaryText || "No summary available.";
  const classification = analysis ? getAnalysisClassificationLabel(analysis) : "";
  const confidence = analysis ? formatAnalysisConfidence(analysis.confidence_score) : null;
  const sentiment = analysis?.sentiment ? String(analysis.sentiment).toLowerCase() : "";

  const dynamicBlocks = analysis
    ? getAnalysisDisplayBlocks(analysis, schemaHintKeys, analysisDisplayPreset)
    : [];

  const totals = intentGroups.reduce(
    (acc, group) => ({
      interested: acc.interested + group.interestedCount,
      neutral: acc.neutral + group.neutralCount,
      negative: acc.negative + group.negativeCount,
    }),
    { interested: 0, neutral: 0, negative: 0 }
  );

  const grandTotal = totals.interested + totals.neutral + totals.negative || items.length;

  return (
    <div id="slide-presentation-root" className="flex flex-col gap-4 p-6 bg-slate-100 min-h-full items-center select-none">
      {/* Slide Toolbar Controls */}
      <div className="flex items-center justify-between w-full max-w-5xl bg-white border border-slate-200/60 rounded-xl p-3 shadow-3xs select-none">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-250/40 cursor-pointer"
        >
          <span>← Back to Visualizer</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-250/40 cursor-pointer"
          >
            {isDarkTheme ? (
              <>
                <Sun className="size-3.5 text-amber-500" />
                <span>Light Slide</span>
              </>
            ) : (
              <>
                <Moon className="size-3.5 text-slate-500" />
                <span>Dark Slide</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-250/40 cursor-pointer"
            title={isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="size-3.5" />
                <span>Exit Full</span>
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* presentation slide container (16:9 aspect ratio) */}
      <div
        id="presentation-slide-card"
        className={cn(
          "w-full max-w-5xl aspect-video rounded-3xl p-8 border shadow-xl flex flex-col justify-between transition-all duration-500 select-text overflow-hidden relative",
          isDarkTheme
            ? "bg-slate-950 border-slate-850 text-white shadow-slate-950/40"
            : "bg-white border-slate-200 text-slate-900 shadow-slate-200/50"
        )}
      >
        {/* Decorative subtle background gradient nodes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl -z-10">
          <div className={cn(
            "rounded-full blur-3xl absolute opacity-30 w-[400px] h-[400px] -right-20 -top-20",
            isDarkTheme ? "bg-indigo-900/40" : "bg-indigo-50/50"
          )} />
          <div className={cn(
            "rounded-full blur-3xl absolute opacity-30 w-[300px] h-[300px] -left-20 -bottom-20",
            isDarkTheme ? "bg-brand/20" : "bg-brand/5"
          )} />
        </div>

        {/* Slide Header */}
        <div className="flex items-start justify-between border-b border-dashed border-slate-200/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-brand text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
                {isSingleTextSummary ? "AI Text Summary" : "AI Summary Report"}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider leading-none",
                isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
              )}>
                RUN ID #{shortId}
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight leading-tight mt-1">
              Gemini AI Intel Digest & Analysis
            </h2>
          </div>
          {/* Logo / Brand Watermark */}
          <div className="text-right flex items-center gap-2 select-none">
            <div className="size-6 rounded-lg bg-linear-to-tr from-brand to-brand-strong flex items-center justify-center font-black text-white text-[10px] shadow-sm shadow-brand/20">
              A
            </div>
            <span className={cn("text-xs font-black tracking-wider", isDarkTheme ? "text-slate-400" : "text-slate-500")}>
              Adapter Works
            </span>
          </div>
        </div>

        {/* Slide Body (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 flex-1 items-stretch min-h-0">

          {/* Column 1: Executive Digest & Verdict */}
          <div className={cn(
            "rounded-2xl p-5 border flex flex-col justify-between min-h-0 gap-4",
            isDarkTheme ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/50"
          )}>
            <div className="space-y-3 min-h-0 overflow-y-auto">
              <div className="flex items-center gap-1.5 select-none">
                <Sparkles className="size-3.5 text-brand shrink-0 animate-pulse" />
                <span className={cn("text-[10px] font-black uppercase tracking-wider", isDarkTheme ? "text-slate-400" : "text-slate-500")}>
                  Executive Summary
                </span>
              </div>
              <p className={cn(
                "text-xs leading-relaxed font-semibold line-clamp-6",
                isDarkTheme ? "text-slate-200" : "text-slate-700"
              )}>
                {summary}
              </p>
            </div>

            {/* Badges / Sentiment */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200/10 shrink-0 select-none">
              {classification && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                  classification.toLowerCase().includes("interest")
                    ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/25"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                )}>
                  <BadgeCheck className="size-2.5" />
                  {classification}
                </span>
              )}
              {sentiment && (
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                  sentiment === "positive"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-sm shadow-emerald-500/10"
                    : sentiment === "negative"
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/35 shadow-sm shadow-rose-500/10"
                      : "bg-slate-500/15 text-slate-300 border-slate-500/35"
                )}>
                  {sentiment}
                </span>
              )}
            </div>
          </div>

          {/* Column 2: Ratios & Quantitative Signals */}
          <div className={cn(
            "rounded-2xl p-5 border flex flex-col justify-between min-h-0 gap-4",
            isDarkTheme ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/50"
          )}>
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 select-none">
                <Activity className="size-3.5 text-amber-500 shrink-0" />
                <span className={cn("text-[10px] font-black uppercase tracking-wider", isDarkTheme ? "text-slate-400" : "text-slate-500")}>
                  Metrics & Ratios
                </span>
              </div>

              {/* Ratios bar charts */}
              {intentGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex rounded-full overflow-hidden h-2.5 w-full bg-slate-800 border border-slate-700/50">
                    <div className="h-full bg-emerald-500" style={{ width: `${totals.interested ? (totals.interested / grandTotal) * 100 : 0}%` }} title="Interested" />
                    <div className="h-full bg-slate-400" style={{ width: `${totals.neutral ? (totals.neutral / grandTotal) * 100 : 0}%` }} title="Neutral" />
                    <div className="h-full bg-rose-500" style={{ width: `${totals.negative ? (totals.negative / grandTotal) * 100 : 0}%` }} title="Negative" />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <span className="block text-[8px] font-bold text-emerald-450 uppercase">Interested</span>
                      <span className="block text-sm font-black text-emerald-450 leading-tight mt-0.5">{totals.interested}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Neutral</span>
                      <span className="block text-sm font-black text-slate-400 leading-tight mt-0.5">{totals.neutral}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <span className="block text-[8px] font-bold text-rose-450 uppercase">Negative</span>
                      <span className="block text-sm font-black text-rose-450 leading-tight mt-0.5">{totals.negative}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confidence Meter */}
              {confidence !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline select-none">
                    <span className={cn("text-[9px] font-bold uppercase", isDarkTheme ? "text-slate-500" : "text-slate-400")}>Confidence Score</span>
                    <span className="text-base font-black text-amber-500">{confidence}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-amber-500 to-amber-600 h-full rounded-full"
                      style={{ width: `${parseFloat(confidence) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Comments Counter */}
            <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none pt-2 border-t border-slate-200/10">
              <UsersIcon className="size-3" />
              <span>{grandTotal.toLocaleString()} total items analyzed</span>
            </div>
          </div>

          {/* Column 3: Quotes / Raw evidence snippet */}
          <div className={cn(
            "rounded-2xl p-5 border flex flex-col justify-between min-h-0 gap-4",
            isDarkTheme ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/50"
          )}>
            <div className="space-y-3 min-h-0 overflow-y-auto">
              <div className="flex items-center gap-1.5 select-none">
                <Database className="size-3.5 text-emerald-500 shrink-0" />
                <span className={cn("text-[10px] font-black uppercase tracking-wider", isDarkTheme ? "text-slate-400" : "text-slate-500")}>
                  Supporting Evidence
                </span>
              </div>

              {/* Render dynamic evidence entries as quote bubble */}
              {(() => {
                const evidenceBlock = dynamicBlocks.find((b) => b.id === "evidence");
                const firstEntry = evidenceBlock?.entries[0];
                const commentText = firstEntry ? String(firstEntry.value) : "";

                if (commentText) {
                  const limit = 180;
                  const cropped = commentText.length > limit ? commentText.slice(0, limit) + "..." : commentText;
                  return (
                    <div className="relative p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 italic">
                      <div className="absolute right-2 top-2 text-slate-500/20">
                        <Quote className="size-6 transform rotate-180" />
                      </div>
                      <p className={cn(
                        "text-[10.5px] leading-relaxed font-medium pl-1",
                        isDarkTheme ? "text-slate-350" : "text-slate-600"
                      )}>
                        &ldquo;{cropped}&rdquo;
                      </p>
                    </div>
                  );
                }

                return (
                  <p className="text-[10px] text-slate-400 italic">No evidence snippets available.</p>
                );
              })()}
            </div>

            {/* Verdict text if available */}
            {analysis?.verdict && (
              <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <span className="block text-[8px] font-extrabold text-indigo-400 uppercase tracking-widest select-none">Verdict Summary</span>
                <p className={cn(
                  "text-[10px] font-bold mt-1 line-clamp-2 leading-relaxed",
                  isDarkTheme ? "text-indigo-200" : "text-indigo-850"
                )}>
                  {analysis.verdict}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Slide Footer */}
        <div className="flex items-center justify-between border-t border-dashed border-slate-200/10 pt-4 text-[9px] font-bold text-slate-400 select-none">
          <span>CLASSIFIED REPORT &bull; FOR INTERNAL PRESENTATION ONLY</span>
          <span className="font-semibold text-[8px] opacity-75">
            Exported via Next.js Pipeline Visualizer Dashboard
          </span>
        </div>
      </div>

      {/* Helpful screenshot instruction tip banner */}
      <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 max-w-5xl w-full select-none">
        <Info className="size-4 text-indigo-600 shrink-0" />
        <span className="text-[11px] text-indigo-900 font-semibold leading-relaxed">
          💡 <strong>Tip for Presentations:</strong> Press <strong>Cmd + Shift + 4</strong> (Mac) or <strong>Win + Shift + S</strong> (Windows) and drag a selection around the slide card above to capture this report slide directly to your clipboard.
        </span>
      </div>
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
