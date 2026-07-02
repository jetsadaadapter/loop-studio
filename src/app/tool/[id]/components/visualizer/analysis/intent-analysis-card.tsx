"use client";

import {
  ExternalLink,
  TrendingUp,
  Users,
  MessageCircle,
  ThumbsDown,
  Crown,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatAnalysisConfidence,
  getAnalysisClassificationLabel,
  getAnalysisDisplayBlocks,
  hasIntentAnalysisPayload,
  groupMetricsByPostId,
  type AnalysisDisplayPreset,
  type AnalysisResult,
} from "../../../tool-job-utils";
import { AnalysisBlockEntry } from "./analysis-block-entry";
import { MetricsPostCard } from "./metrics-post-card";
import { AnalysisInfoBoxes } from "./analysis-info-boxes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface IntentAnalysisItem {
  postUrl?: string;
  url?: string;
  facebookUrl?: string;
  inputUrl?: string;
  permalink_url?: string;
  sourceKeyValue?: string;
  analysis?: AnalysisResult;
  [key: string]: unknown;
}

interface IntentAnalysisCardProps {
  item: IntentAnalysisItem;
  index: number;
  schemaHintKeys?: string[];
  analysisDisplayPreset?: AnalysisDisplayPreset;
  isGenericMode?: boolean;
}

const GROUP_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    bar: string;
  }
> = {
  "potential buyers": {
    icon: TrendingUp,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
  },
  "general interest": {
    icon: MessageCircle,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    bar: "bg-sky-400",
  },
  "general interest/inquiry": {
    icon: MessageCircle,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    bar: "bg-sky-400",
  },
  "negative/opposed": {
    icon: ThumbsDown,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    bar: "bg-rose-500",
  },
  negative: {
    icon: ThumbsDown,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    bar: "bg-rose-500",
  },
};

const DEFAULT_GROUP_COLORS = [
  {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    icon: Users,
  },
  {
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    bar: "bg-sky-400",
    icon: MessageCircle,
  },
  {
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    bar: "bg-rose-500",
    icon: ThumbsDown,
  },
];

function getGroupConfig(label: string, idx: number) {
  const key = label.toLowerCase().trim();
  return (
    GROUP_CONFIG[key] ?? {
      ...DEFAULT_GROUP_COLORS[idx % DEFAULT_GROUP_COLORS.length],
    }
  );
}

export function IntentAnalysisCard({
  item,
  index,
  schemaHintKeys = [],
  analysisDisplayPreset,
  isGenericMode = false,
}: IntentAnalysisCardProps) {
  const analysis = item.analysis;
  const postUrl =
    analysis?.postUrl ||
    item.postUrl ||
    item.facebookUrl ||
    item.url ||
    item.inputUrl ||
    item.permalink_url ||
    (item.sourceKeyValue !== "aggregate" && item.sourceKeyValue !== "flat-result" ? item.sourceKeyValue : "") ||
    "";
  const isLink = typeof postUrl === "string" && (postUrl.startsWith("http://") || postUrl.startsWith("https://"));
  const groups = analysis?.groups ?? [];
  const verdict = analysis?.verdict ?? "";
  const summary = analysis?.summary_of_intent || analysis?.summary || "";
  const keywords = analysis?.keywords ?? "";
  const sentiment = analysis?.sentiment ?? "";
  const isLeader = analysis?.conversionLeader === true;
  const classification = getAnalysisClassificationLabel(analysis);
  const confidence = formatAnalysisConfidence(analysis?.confidence_score);
  const dynamicBlocks = getAnalysisDisplayBlocks(
    analysis,
    schemaHintKeys,
    analysisDisplayPreset,
    isGenericMode,
  );
  const hasIntentPayload = hasIntentAnalysisPayload(analysis);
  const purchaseSignal = analysis?.purchase_intent === 'interested'
    ? true
    : analysis?.purchase_intent === 'disinterested' ? false : (analysis?.purchase_intent_signal as boolean | undefined);

  const showClassification = !!classification;
  const showConfidence = confidence !== null && confidence !== undefined;
  const showPurchaseSignal = purchaseSignal === true || purchaseSignal === false;
  const visibleBoxesCount = [showClassification, showConfidence, showPurchaseSignal].filter(Boolean).length;

  const totalCount = groups.reduce((acc, g) => acc + g.count, 0);

  const displayUrl = postUrl.length > 60 ? `...${postUrl.slice(-50)}` : postUrl;
  const classificationTone = (() => {
    const normalized = classification.toLowerCase();
    if (
      normalized.includes("interested") ||
      normalized.includes("buy") ||
      normalized.includes("purchase") ||
      normalized.includes("positive") ||
      normalized.includes("สนใจ")
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (
      normalized.includes("negative") ||
      normalized.includes("opposed") ||
      normalized.includes("แง่ลบ") ||
      normalized.includes("เชิงลบ") ||
      normalized.includes("ต่อต้าน")
    ) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }

    return "bg-slate-50 text-slate-600 border-slate-200";
  })();

  return (
    <div
      className={cn(
        "bg-white/90 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        isLeader
          ? "border-emerald-300/60 ring-1 ring-emerald-200/40 shadow-sm"
          : "border-slate-200/60 shadow-xs",
      )}
    >
      {/* Card Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50/40 to-white/60 border-b border-slate-200/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="size-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center shrink-0 select-none">
              <span className="text-xs font-black text-slate-500">
                #{index + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {isGenericMode ? (
                <p className="text-sm font-bold text-slate-800">
                  Result #{index + 1}
                </p>
              ) : (
                <>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Post URL
                  </p>
                  {postUrl ? (
                    isLink ? (
                      <a
                        href={postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand hover:text-brand-strong hover:underline inline-flex items-center gap-1.5 truncate max-w-full"
                        title={postUrl}
                      >
                        <span className="truncate">{displayUrl}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-full" title={postUrl}>
                        {postUrl === "aggregate" ? "Aggregate Analysis" : postUrl}
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No URL
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sentiment & Verdict / Leader Badges */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            {(item.error || (analysis && "error" in (analysis as Record<string, unknown>))) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                <AlertCircle className="size-3" />
                Error
              </span>
            )}
            {sentiment && (
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  String(sentiment).toLowerCase() === "positive"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : String(sentiment).toLowerCase() === "negative"
                      ? "bg-rose-50 text-rose-700 border-rose-200/60"
                      : "bg-slate-50 text-slate-600 border-slate-200/60",
                )}
              >
                {sentiment}
              </span>
            )}
            {hasIntentPayload && classification && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  classificationTone,
                )}
              >
                <BadgeCheck className="size-3" />
                {classification}
              </span>
            )}
            {isLeader && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                <Crown className="size-3" />
                Top Performer
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {(item.error || (analysis && "error" in (analysis as Record<string, unknown>))) ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-800 animate-fade-in">
            <AlertCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700">Analysis Error</h5>
              <p className="text-xs text-rose-600 font-medium leading-relaxed">
                {String(item.error || (analysis as Record<string, unknown>)?.error || "No result returned by Gemini")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Groups Breakdown */}
            {groups.length > 0 && (
              <div className="space-y-3">
                {/* Stacked bar */}
                <div className="flex rounded-full overflow-hidden h-2 w-full gap-0.5 bg-slate-100/80">
                  {groups.map((g, i) => {
                    const cfg = getGroupConfig(g.label, i);
                    const pct =
                      totalCount > 0 ? (g.count / totalCount) * 100 : g.percentage;
                    const widthClass =
                      pct <= 0
                        ? "w-0"
                        : pct <= 10
                          ? "w-[10%]"
                          : pct <= 20
                            ? "w-[20%]"
                            : pct <= 30
                              ? "w-[30%]"
                              : pct <= 40
                                ? "w-[40%]"
                                : pct <= 50
                                  ? "w-1/2"
                                  : pct <= 60
                                    ? "w-[60%]"
                                    : pct <= 70
                                      ? "w-[70%]"
                                      : pct <= 80
                                        ? "w-[80%]"
                                        : pct <= 90
                                          ? "w-[90%]"
                                          : "w-full";
                    return (
                      <div
                        key={`bar-${i}`}
                        className={cn(
                          "h-full transition-all duration-500 shrink-0",
                          cfg.bar,
                          widthClass,
                        )}
                        title={`${g.label}: ${g.count} (${g.percentage}%)`}
                      />
                    );
                  })}
                </div>

                {/* Group chips */}
                <TooltipProvider delay={200}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {groups.map((g, i) => {
                      return (
                        <Tooltip key={`group-${i}`}>
                          <TooltipTrigger className="w-full text-left cursor-help">
                            <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-200/60 bg-white hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-700">
                                  {g.label}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-base font-black leading-none tabular-nums text-slate-800">
                                  {g.count.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  ({g.percentage}%)
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs font-semibold">{g.label}</p>
                            <p className="text-xs text-slate-300">
                              {g.count} comments ({g.percentage}% of total {totalCount})
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>
            )}

            {/* AI Summary & Keywords */}
            {(summary ||
              (Array.isArray(keywords) ? keywords.length > 0 : !!keywords) ||
              hasIntentPayload ||
              dynamicBlocks.length > 0) && (
                <div className="space-y-3">
                  {summary && (
                    <div className="border-l-3 border-brand/60 pl-4 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        AI Analysis Summary
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {summary}
                      </p>
                    </div>
                  )}

                  {hasIntentPayload && visibleBoxesCount > 0 && (
                    <AnalysisInfoBoxes
                      classification={classification}
                      confidence={confidence}
                      purchaseSignal={purchaseSignal}
                      variant="semantic"
                      classificationTone={classificationTone}
                    />
                  )}

                  {(Array.isArray(keywords) ? keywords.length > 0 : !!keywords) && (
                    <div className="pl-4 flex flex-wrap gap-2 pt-1">
                      {(Array.isArray(keywords)
                        ? keywords
                        : String(keywords).split(/\s+/)
                      )
                        .filter((kw: string) => kw.trim().length > 0)
                        .map((kw: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-600 text-[10px] font-semibold select-text hover:bg-slate-200/70 transition-colors cursor-default border border-slate-200/60"
                          >
                            #{kw.replace(/^#/, "")}
                          </span>
                        ))}
                    </div>
                  )}

                  {dynamicBlocks.length > 0 && (
                    <div className="relative space-y-6 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-150/70 before:rounded-full pt-1">
                      {dynamicBlocks.map((block) => {
                        const isMetrics = block.id === "metrics";

                        return (
                          <section
                            key={block.id}
                            className="rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-4 bg-white relative"
                          >
                            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider leading-none text-slate-700">
                                  {block.title}
                                </h4>
                                <p className="text-[10px] font-medium text-slate-400">
                                  {block.description}
                                </p>
                              </div>
                            </div>

                            {/* Grid with dynamic columns layout */}
                            {(() => {
                              // Special handling for metrics block - group by post ID
                              if (isMetrics) {
                                const groupedByPost = groupMetricsByPostId(block.entries);

                                return (
                                  <div className="space-y-7">
                                    {Object.entries(groupedByPost)
                                      .sort(([a], [b]) => {
                                        if (a === '_ungrouped') return 1;
                                        if (b === '_ungrouped') return -1;
                                        return a.localeCompare(b);
                                      })
                                      .map(([postId, entries], idx) => (
                                        <MetricsPostCard
                                          key={postId}
                                          postId={postId}
                                          entries={entries}
                                          idx={idx}
                                          blockId={block.id}
                                          variant="minimal"
                                        />
                                      ))}
                                  </div>
                                );
                              }

                              // Default rendering for non-metrics blocks
                              const isSingleCol =
                                block.entries.length === 1 ||
                                block.entries.some((entry) => {
                                  const isLongVal =
                                    typeof entry.value === "string" &&
                                    (entry.value.length > 150 || entry.value.includes("\n"));
                                  return (
                                    isLongVal ||
                                    entry.valueType === "object" ||
                                    entry.valueType === "array"
                                  );
                                });

                              return (
                                <div
                                  className={cn(
                                    "grid gap-3.5",
                                    isSingleCol ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                                  )}
                                >
                                  {block.entries.map((entry) => (
                                    <AnalysisBlockEntry
                                      key={`${block.id}-${entry.key}`}
                                      entry={entry}
                                      blockId={block.id}
                                    />
                                  ))}
                                </div>
                              );
                            })()}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* Verdict */}
            {verdict && (
              <div className="bg-sky-50/40 border border-sky-200/50 rounded-xl p-4 border-l-3 border-l-sky-500">
                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1.5">
                  Verdict
                </p>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {verdict}
                </p>
              </div>
            )}

            {/* Total comments analyzed */}
            {totalCount > 0 && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60">
                <Users className="size-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {totalCount.toLocaleString()} comments analyzed
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
