"use client";

import {
  ExternalLink,
  TrendingUp,
  Users,
  MessageCircle,
  ThumbsDown,
  Crown,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatAnalysisConfidence,
  getAnalysisDisplayBlocks,
  hasIntentAnalysisPayload,
  normalizeIntentClassification,
  type AnalysisDisplayPreset,
  type AnalysisResult,
} from "../../tool-job-utils";

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
    item.sourceKeyValue ||
    "";
  const groups = analysis?.groups ?? [];
  const verdict = analysis?.verdict ?? "";
  const summary = analysis?.summary_of_intent || analysis?.summary || "";
  const keywords = analysis?.keywords ?? "";
  const sentiment = analysis?.sentiment ?? "";
  const isLeader = analysis?.conversionLeader === true;
  const classification = normalizeIntentClassification(analysis);
  const confidence = formatAnalysisConfidence(analysis?.confidence_score);
  const dynamicBlocks = getAnalysisDisplayBlocks(
    analysis,
    schemaHintKeys,
    analysisDisplayPreset,
    isGenericMode,
  );
  const hasIntentPayload = hasIntentAnalysisPayload(analysis);
  const purchaseSignal = analysis?.purchase_intent_signal;

  const totalCount = groups.reduce((acc, g) => acc + g.count, 0);

  const displayUrl = postUrl.length > 60 ? `...${postUrl.slice(-50)}` : postUrl;
  const classificationTone = {
    Interested: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Neutral: "bg-slate-50 text-slate-600 border-slate-200",
    Negative: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        isLeader
          ? "border-emerald-300 ring-2 ring-emerald-100"
          : "border-slate-200/60",
      )}
    >
      {/* Card Header */}
      <div className="px-5 py-3.5 bg-linear-to-r from-slate-50/60 to-white border-b border-slate-150/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-7 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 select-none">
              <span className="text-[10px] font-black text-slate-500">
                #{index + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {isGenericMode ? (
                <p className="text-xs font-bold text-slate-700">
                  Result #{index + 1}
                </p>
              ) : (
                <>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    Post URL
                  </p>
                  {postUrl ? (
                    <a
                      href={postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand hover:text-brand-strong hover:underline inline-flex items-center gap-1 truncate max-w-full"
                      title={postUrl}
                    >
                      <span className="truncate">{displayUrl}</span>
                      <ExternalLink className="size-3 shrink-0 opacity-70" />
                    </a>
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
            {sentiment && (
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border",
                  String(sentiment).toLowerCase() === "positive"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : String(sentiment).toLowerCase() === "negative"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-slate-50 text-slate-600 border-slate-200",
                )}
              >
                {sentiment}
              </span>
            )}
            {hasIntentPayload && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border",
                  classificationTone[classification],
                )}
              >
                <BadgeCheck className="size-2.5" />
                {classification}
              </span>
            )}
            {isLeader && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold uppercase tracking-wider">
                <Crown className="size-2.5" />
                Top Performer
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Groups Breakdown */}
        {groups.length > 0 && (
          <div className="space-y-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Intent Breakdown
            </p>

            {/* Stacked bar */}
            <div className="flex rounded-full overflow-hidden h-2.5 w-full gap-0.5 bg-slate-100">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {groups.map((g, i) => {
                const cfg = getGroupConfig(g.label, i);
                const Icon = cfg.icon;
                return (
                  <div
                    key={`group-${i}`}
                    className={cn(
                      "flex flex-col gap-1 p-3 rounded-xl border bg-slate-50/20",
                      cfg.bg,
                      cfg.border,
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("size-3 shrink-0", cfg.color)} />
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider leading-tight",
                          cfg.color,
                        )}
                      >
                        {g.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span
                        className={cn(
                          "text-base font-black leading-none tabular-nums",
                          cfg.color,
                        )}
                      >
                        {g.count.toLocaleString()}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-bold",
                          cfg.color,
                          "opacity-75",
                        )}
                      >
                        {g.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Summary & Keywords */}
        {(summary ||
          (Array.isArray(keywords) ? keywords.length > 0 : !!keywords) ||
          hasIntentPayload ||
          dynamicBlocks.length > 0) && (
          <div className="space-y-3.5">
            {summary && (
              <div className="border-l-3 border-brand pl-3.5 space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  AI Analysis Summary
                </p>
                <p className="text-xs text-slate-650 leading-relaxed font-medium">
                  {summary}
                </p>
              </div>
            )}

            {hasIntentPayload && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div
                  className={cn(
                    "rounded-xl border px-3 py-2.5",
                    classificationTone[classification],
                  )}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                    Classification
                  </p>
                  <p className="mt-1 text-sm font-black leading-tight">
                    {classification}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Confidence
                  </p>
                  <p className="mt-1 text-sm font-black leading-tight text-slate-800">
                    {confidence || "N/A"}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-xl border px-3 py-2.5",
                    purchaseSignal === true
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : purchaseSignal === false
                        ? "bg-slate-50 border-slate-200 text-slate-600"
                        : "bg-amber-50 border-amber-200 text-amber-700",
                  )}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                    Purchase Signal
                  </p>
                  <p className="mt-1 text-sm font-black leading-tight">
                    {purchaseSignal === true
                      ? "Yes"
                      : purchaseSignal === false
                        ? "No"
                        : "Unknown"}
                  </p>
                </div>
              </div>
            )}

            {(Array.isArray(keywords) ? keywords.length > 0 : !!keywords) && (
              <div className="pl-3.5 flex flex-wrap gap-1.5 pt-0.5">
                {(Array.isArray(keywords)
                  ? keywords
                  : String(keywords).split(/\s+/)
                )
                  .filter((kw: string) => kw.trim().length > 0)
                  .map((kw: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold select-text hover:bg-slate-200/70 transition-colors cursor-default"
                    >
                      #{kw.replace(/^#/, "")}
                    </span>
                  ))}
              </div>
            )}

            {dynamicBlocks.length > 0 && (
              <div className="space-y-3 pt-1">
                {dynamicBlocks.map((block) => (
                  <section
                    key={block.id}
                    className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-xs"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {block.title}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                      {block.description}
                    </p>
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {block.entries.map((entry) => (
                        <div
                          key={`${block.id}-${entry.key}`}
                          className="rounded-lg border border-slate-200/70 bg-white px-3 py-2.5"
                        >
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {entry.key}
                          </p>
                          {entry.valueType === "object" ||
                          entry.valueType === "array" ? (
                            <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-[11px] font-mono text-slate-700 whitespace-pre-wrap wrap-break-word">
                              {entry.value}
                            </pre>
                          ) : (
                            <p className="mt-1 text-xs font-semibold text-slate-700 leading-relaxed wrap-break-word">
                              {entry.value}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verdict */}
        {verdict && (
          <div className="bg-sky-50/30 border border-sky-100/50 rounded-xl p-4 border-l-3 border-l-sky-500/80 shadow-2xs">
            <p className="text-[9px] font-bold text-sky-600 uppercase tracking-wider mb-1">
              Verdict
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              {verdict}
            </p>
          </div>
        )}

        {/* Total comments analyzed */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Users className="size-3 text-slate-450" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {totalCount.toLocaleString()} comments analyzed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
