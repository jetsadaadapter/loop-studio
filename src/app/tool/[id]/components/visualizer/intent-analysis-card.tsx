"use client";

import {
  ExternalLink,
  TrendingUp,
  Users,
  MessageCircle,
  ThumbsDown,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "../../tool-job-utils";

export interface IntentAnalysisItem {
  postUrl?: string;
  url?: string;
  sourceKeyValue?: string;
  analysis?: AnalysisResult;
  [key: string]: unknown;
}

interface IntentAnalysisCardProps {
  item: IntentAnalysisItem;
  index: number;
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

export function IntentAnalysisCard({ item, index }: IntentAnalysisCardProps) {
  const analysis = item.analysis;
  const postUrl =
    analysis?.postUrl || item.postUrl || item.url || item.sourceKeyValue || "";
  const groups = analysis?.groups ?? [];
  const verdict = analysis?.verdict ?? "";
  const summary = analysis?.summary ?? "";
  const keywords = analysis?.keywords ?? "";
  const sentiment = analysis?.sentiment ?? "";
  const isLeader = analysis?.conversionLeader === true;

  const totalCount = groups.reduce((acc, g) => acc + g.count, 0);

  const displayUrl = postUrl.length > 60 ? `...${postUrl.slice(-50)}` : postUrl;

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
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="size-7 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 select-none">
              <span className="text-[10px] font-extrabold text-slate-500">
                #{index + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                Post URL
              </p>
              {postUrl ? (
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 truncate max-w-full"
                  title={postUrl}
                >
                  <span className="truncate">{displayUrl}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">No URL</span>
              )}
            </div>
          </div>

          {/* Verdict / Leader Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isLeader && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider select-none">
                <Crown className="size-2.5" />
                Top Performer
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Groups Breakdown */}
        {groups.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Intent Breakdown
            </p>

            {/* Stacked bar */}
            <div className="flex rounded-full overflow-hidden h-3 w-full gap-0.5">
              {groups.map((g, i) => {
                const cfg = getGroupConfig(g.label, i);
                const pct =
                  totalCount > 0 ? (g.count / totalCount) * 100 : g.percentage;
                return (
                  <div
                    key={`bar-${i}`}
                    className={cn(
                      "h-full transition-all duration-500",
                      cfg.bar,
                    )}
                    style={{ width: `${pct}%` }}
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
                      "flex flex-col gap-1 p-3 rounded-xl border",
                      cfg.bg,
                      cfg.border,
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("size-3 shrink-0", cfg.color)} />
                      <span
                        className={cn(
                          "text-[9.5px] font-extrabold uppercase tracking-wider leading-tight",
                          cfg.color,
                        )}
                      >
                        {g.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span
                        className={cn(
                          "text-lg font-black leading-none tabular-nums",
                          cfg.color,
                        )}
                      >
                        {g.count.toLocaleString()}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-bold",
                          cfg.color,
                          "opacity-70",
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

        {/* AI Summary */}
        {summary && (
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              AI Analysis Summary
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {summary}
            </p>
          </div>
        )}

        {/* AI Keywords as Hashtags */}
        {(Array.isArray(keywords) ? keywords.length > 0 : !!keywords) && (
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              AI Analysis Keywords
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {(Array.isArray(keywords)
                ? keywords
                : String(keywords).split(/\s+/)
              )
                .filter((kw: string) => kw.trim().length > 0)
                .map((kw: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs font-semibold text-slate-700 select-text"
                  >
                    #{kw.replace(/^#/, "")}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* AI Sentiment as Badge */}
        {sentiment && (
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              AI Analysis Sentiment
            </p>
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide shadow-sm select-none",
                String(sentiment).toLowerCase() === "positive"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : String(sentiment).toLowerCase() === "negative"
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200",
              )}
            >
              {String(sentiment).charAt(0).toUpperCase() +
                String(sentiment).slice(1)}
            </span>
          </div>
        )}

        {/* Verdict */}
        {verdict && (
          <div className="bg-linear-to-r from-sky-50 to-indigo-50 rounded-xl border border-sky-100 p-3.5">
            <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider mb-1.5">
              Verdict
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              {verdict}
            </p>
          </div>
        )}

        {/* Total comments analyzed */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <Users className="size-3 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-semibold">
              {totalCount.toLocaleString()} comments analyzed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
