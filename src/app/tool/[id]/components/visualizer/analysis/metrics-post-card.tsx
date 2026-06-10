"use client";

import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBuyIntent } from "../../../tool-job-utils";
import { AnalysisBlockEntry } from "./analysis-block-entry";
import type { AnalysisDisplayEntry } from "../../../tool-job-utils";

interface MetricsPostCardProps {
  postId: string;
  entries: Array<AnalysisDisplayEntry & { field?: string }>;
  idx: number;
  blockId: string;
  variant?: 'premium' | 'minimal';
}

export function MetricsPostCard({
  postId,
  entries,
  idx,
  blockId,
  variant = 'minimal'
}: MetricsPostCardProps) {
  const { value: buyIntentValue, color: intentColor } = calculateBuyIntent(entries);
  const isPremium = variant === 'premium';

  const containerStyles = isPremium
    ? "bg-gradient-to-br from-white via-amber-50/20 to-white shadow-lg hover:shadow-xl border-2 border-amber-200/40"
    : "bg-white shadow-sm hover:shadow-md border border-slate-200/60";

  const headerBg = isPremium
    ? "bg-gradient-to-r from-amber-50 via-amber-50/60 to-white border-b-2 border-amber-100/60"
    : "bg-slate-50/40 border-b border-slate-200/60";

  return (
    <div className={cn("rounded-2xl overflow-hidden transition-all duration-300", containerStyles)}>
      {postId !== '_ungrouped' && (
        <div className={cn("relative px-5 py-4", headerBg)}>
          {isPremium && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-transparent pointer-events-none" />
          )}

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              {isPremium ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl blur-sm opacity-60" />
                  <div className="relative flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg ring-2 ring-white">
                    <span className="text-sm font-black drop-shadow-sm">
                      {idx + 1}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center size-9 rounded-xl bg-slate-100 border border-slate-200/60">
                  <span className="text-sm font-black text-slate-600">
                    {idx + 1}
                  </span>
                </div>
              )}

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-wide",
                    isPremium ? "text-amber-900" : "text-slate-700"
                  )}>
                    Post ID
                  </span>
                  {buyIntentValue > 0 && (
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                      isPremium ? (
                        intentColor === 'emerald' ? "bg-emerald-500 text-white" :
                          intentColor === 'amber' ? "bg-amber-500 text-white" :
                            intentColor === 'orange' ? "bg-orange-500 text-white" :
                              "bg-slate-400 text-white"
                      ) : "bg-slate-100 border border-slate-200/60 rounded-lg text-slate-700"
                    )}>
                      {isPremium && <Activity className="size-2.5" />}
                      {buyIntentValue}%
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-sm font-sans font-bold tracking-tight",
                  isPremium ? "text-amber-800" : "text-slate-800"
                )}>
                  {postId}
                </span>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl",
              isPremium
                ? "bg-white/80 backdrop-blur-sm border border-amber-200/60 shadow-sm"
                : "bg-white border border-slate-200/60"
            )}>
              {isPremium && <Activity className="size-3.5 text-amber-600" />}
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wide",
                isPremium ? "text-amber-700" : "text-slate-700"
              )}>
                {entries.length}
              </span>
              <span className={cn(
                "text-[10px] font-semibold",
                isPremium ? "text-amber-600" : "text-slate-500"
              )}>
                metrics
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <AnalysisBlockEntry
              key={`${blockId}-${entry.key}`}
              entry={entry}
              blockId={blockId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
