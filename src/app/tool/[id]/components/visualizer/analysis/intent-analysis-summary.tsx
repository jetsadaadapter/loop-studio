"use client";

import { Crown, MessageCircle, ThumbsDown, TrendingUp, Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntentAnalysisPostGroup } from "../../../tool-job-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IntentAnalysisSummaryProps {
  groups: IntentAnalysisPostGroup[];
  totalItems: number;
}

const BAR_TONES = {
  Interested: "bg-emerald-500",
  Neutral: "bg-slate-400",
  Negative: "bg-rose-500",
} as const;

const WIDTH_TONES = [
  { min: 0, className: "w-0" },
  { min: 1, className: "w-[10%]" },
  { min: 11, className: "w-[20%]" },
  { min: 21, className: "w-[30%]" },
  { min: 31, className: "w-[40%]" },
  { min: 41, className: "w-1/2" },
  { min: 51, className: "w-[60%]" },
  { min: 61, className: "w-[70%]" },
  { min: 71, className: "w-[80%]" },
  { min: 81, className: "w-[90%]" },
  { min: 91, className: "w-full" },
] as const;

function getWidthClass(percent: number) {
  return (
    [...WIDTH_TONES].reverse().find((step) => percent >= step.min)?.className ||
    "w-0"
  );
}

export function IntentAnalysisSummary({
  groups,
  totalItems,
}: IntentAnalysisSummaryProps) {
  if (groups.length === 0) return null;

  const rankedGroups = [...groups].sort((a, b) => {
    if (b.interestedRatio !== a.interestedRatio) {
      return b.interestedRatio - a.interestedRatio;
    }
    if (b.interestedCount !== a.interestedCount) {
      return b.interestedCount - a.interestedCount;
    }
    return b.totalCount - a.totalCount;
  });

  const totals = groups.reduce(
    (acc, group) => ({
      interested: acc.interested + group.interestedCount,
      neutral: acc.neutral + group.neutralCount,
      negative: acc.negative + group.negativeCount,
    }),
    { interested: 0, neutral: 0, negative: 0 },
  );

  const grandTotal = Math.max(
    totalItems,
    totals.interested + totals.neutral + totals.negative,
  );

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-white px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Dynamic Intent Overview
            </p>
            <h3 className="mt-1 text-base font-black tracking-tight text-slate-900">
              Post comparison by classification
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              The posts are grouped from the raw `item.analysis.classification`
              payload so you can compare purchase intent at a glance.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-brand/10 bg-brand/5 px-3 py-1.5 text-[10px] font-bold text-brand">
            <TrendingUp className="size-3.5" />
            {grandTotal.toLocaleString()} analyzed items
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <MessageCircle className="size-3.5" /> Interested
            </div>
            <div className="mt-1 text-lg font-black text-emerald-800 tabular-nums">
              {totals.interested}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <MessageCircle className="size-3.5" /> Neutral
            </div>
            <div className="mt-1 text-lg font-black text-slate-800 tabular-nums">
              {totals.neutral}
            </div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
              <ThumbsDown className="size-3.5" /> Negative
            </div>
            <div className="mt-1 text-lg font-black text-rose-800 tabular-nums">
              {totals.negative}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Job-level ranking
              </p>
              <h4 className="mt-1 text-sm font-black text-slate-900">
                Highest purchase intent by post
              </h4>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">
              Top: {rankedGroups[0]?.interestedRatio ?? 0}%
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {rankedGroups.map((group, index) => {
              const title =
                group.title.length > 56
                  ? `${group.title.slice(0, 53)}...`
                  : group.title;
              return (
                <div key={`rank-${group.groupKey}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <div className="min-w-0 font-semibold text-slate-700">
                      <span className="mr-1.5 inline-flex size-4 items-center justify-center rounded bg-slate-200 text-[9px] font-black text-slate-600">
                        {index + 1}
                      </span>
                      <span className="truncate">
                        {title || "Untitled post"}
                      </span>
                    </div>
                    <span className="shrink-0 font-black text-emerald-700 tabular-nums">
                      {group.interestedRatio}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        index === 0 ? "bg-emerald-500" : "bg-emerald-400/80",
                        getWidthClass(group.interestedRatio),
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {rankedGroups.map((group, index) => {
            const topCount = Math.max(
              group.interestedCount,
              group.neutralCount,
              group.negativeCount,
            );
            const isLeader = index === 0;
            const postTitle =
              group.title.length > 90
                ? `${group.title.slice(0, 87)}...`
                : group.title;
            const postUrl =
              group.postUrl.length > 72
                ? `${group.postUrl.slice(0, 69)}...`
                : group.postUrl;

            return (
              <article
                key={group.groupKey}
                className={cn(
                  "rounded-2xl border bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                  isLeader
                    ? "border-emerald-300 ring-2 ring-emerald-100"
                    : "border-slate-200/70",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
                        #{index + 1}
                      </div>
                      {isLeader && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 border border-amber-200">
                          <Crown className="size-2.5" /> Leader
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 line-clamp-2 text-sm font-bold tracking-tight text-slate-900">
                      {postTitle}
                    </h4>
                    {group.postUrl ? (
                      <a
                        href={group.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline line-clamp-1"
                      >
                        <ExternalLink className="size-2.5 shrink-0" />
                        <span className="truncate">{postUrl || "View post"}</span>
                      </a>
                    ) : (
                      <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                        No URL available
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2 text-right",
                      group.leadingClassification === "Interested"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : group.leadingClassification === "Negative"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                    )}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                      Top signal
                    </div>
                    <div className="mt-1 text-sm font-black leading-none">
                      {group.leadingClassification}
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 flex gap-0.5">
                  <div
                    className={cn(
                      BAR_TONES.Interested,
                      "h-full shrink-0",
                      getWidthClass(group.interestedRatio),
                    )}
                    title={`Interested: ${group.interestedCount}`}
                  />
                  <div
                    className={cn(
                      BAR_TONES.Neutral,
                      "h-full shrink-0",
                      getWidthClass(group.neutralRatio),
                    )}
                    title={`Neutral: ${group.neutralCount}`}
                  />
                  <div
                    className={cn(
                      BAR_TONES.Negative,
                      "h-full shrink-0",
                      getWidthClass(group.negativeRatio),
                    )}
                    title={`Negative: ${group.negativeCount}`}
                  />
                </div>

                <TooltipProvider delay={200}>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Tooltip>
                      <TooltipTrigger className="w-full text-left group">
                        <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 cursor-help hover:border-emerald-300 hover:bg-emerald-100 transition-all">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                              Interested
                            </p>
                            <Info className="size-3 text-emerald-500 transition-transform group-hover:scale-110" />
                          </div>
                          <p className="mt-1 text-base font-black text-emerald-800 tabular-nums">
                            {group.interestedCount}
                          </p>
                          <p className="text-[10px] font-semibold text-emerald-600">
                            {group.interestedRatio}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs font-semibold">{group.interestedCount} comments</p>
                        <p className="text-xs text-slate-300">
                          {group.interestedRatio}% of total {group.totalCount} analyzed comments
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger className="w-full text-left group">
                        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-2 cursor-help hover:border-slate-400 hover:bg-slate-100 transition-all">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              Neutral
                            </p>
                            <Info className="size-3 text-slate-400 transition-transform group-hover:scale-110" />
                          </div>
                          <p className="mt-1 text-base font-black text-slate-800 tabular-nums">
                            {group.neutralCount}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500">
                            {group.neutralRatio}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs font-semibold">{group.neutralCount} comments</p>
                        <p className="text-xs text-slate-300">
                          {group.neutralRatio}% of total {group.totalCount} analyzed comments
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger className="w-full text-left group">
                        <div className="rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 px-3 py-2 cursor-help hover:border-rose-300 hover:bg-rose-100 transition-all">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-rose-700">
                              Negative
                            </p>
                            <Info className="size-3 text-rose-500 transition-transform group-hover:scale-110" />
                          </div>
                          <p className="mt-1 text-base font-black text-rose-800 tabular-nums">
                            {group.negativeCount}
                          </p>
                          <p className="text-[10px] font-semibold text-rose-600">
                            {group.negativeRatio}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs font-semibold">{group.negativeCount} comments</p>
                        <p className="text-xs text-slate-300">
                          {group.negativeRatio}% of total {group.totalCount} analyzed comments
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500">
                  <span>
                    {group.totalCount.toLocaleString()} analyzed comments
                  </span>
                  <span>Peak cluster {topCount.toLocaleString()}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
