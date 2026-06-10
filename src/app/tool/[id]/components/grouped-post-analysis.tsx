"use client";

import React from "react";
import { Database, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "../tool-job-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GroupedPostAnalysisProps {
  groupedResults: Array<{ id: string; analysis: AnalysisResult }>;
}

export function GroupedPostAnalysis({ groupedResults }: GroupedPostAnalysisProps) {
  // Group results by classification for a more structured view
  const resultsByCategory = React.useMemo(() => {
    const categories: Record<string, Array<{ id: string; analysis: AnalysisResult }>> = {};
    groupedResults.forEach((res) => {
      const cat = res.analysis.classification || "Unclassified";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(res);
    });

    // Sort posts within each category by buy intent (high to low)
    Object.keys(categories).forEach((cat) => {
      categories[cat].sort((a, b) => {
        const getBuyIntent = (analysis: AnalysisResult) => {
          const raw = analysis.ratio_want_to_buy ?? analysis.intentRatios?.buyIntent;
          return typeof raw === "string" ? parseInt(raw.replace("%", ""), 10) : (raw as number || 0);
        };
        return getBuyIntent(b.analysis) - getBuyIntent(a.analysis);
      });
    });

    return categories;
  }, [groupedResults]);

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="size-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
            Purchase Intent Analysis
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200/60">
          <span className="text-[9px] font-semibold text-slate-500">{groupedResults.length}</span>
          <span className="text-[8px] font-medium text-slate-400">posts</span>
        </div>
      </div>

      {/* Overall Summary Card - More Compact */}
      {Object.keys(resultsByCategory).length > 0 && (
        <div className="bg-gradient-to-br from-violet-50/30 via-white to-indigo-50/20 rounded-lg border border-violet-200/50 p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="size-2.5 text-violet-600" />
            <span className="text-[9px] font-bold text-violet-700 uppercase tracking-wide">
              Distribution
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(resultsByCategory).map(([cat, posts]) => {
              const totalBuy = posts.reduce((sum, p) => {
                const val =
                  typeof p.analysis.ratio_want_to_buy === "string"
                    ? parseInt(p.analysis.ratio_want_to_buy.replace("%", ""), 10)
                    : (p.analysis.ratio_want_to_buy as number || 0);
                return sum + val;
              }, 0);
              const avgBuy = posts.length > 0 ? Math.round(totalBuy / posts.length) : 0;
              const color =
                cat.toLowerCase().includes("สูง") || cat.toLowerCase().includes("high")
                  ? "emerald"
                  : cat.toLowerCase().includes("ต่ำ") || cat.toLowerCase().includes("low")
                  ? "rose"
                  : "amber";

              return (
                <div
                  key={cat}
                  className={cn(
                    "rounded-md p-2 border",
                    color === "emerald" && "bg-emerald-50/40 border-emerald-200/50",
                    color === "rose" && "bg-rose-50/40 border-rose-200/50",
                    color === "amber" && "bg-amber-50/40 border-amber-200/50"
                  )}
                >
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                    {cat}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-base font-black leading-none",
                        color === "emerald" && "text-emerald-700",
                        color === "rose" && "text-rose-700",
                        color === "amber" && "text-amber-700"
                      )}
                    >
                      {posts.length}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">posts</span>
                  </div>
                  {avgBuy > 0 && (
                    <div className="text-[9px] font-medium text-slate-600 mt-0.5">
                      <span
                        className={cn(
                          "font-bold",
                          avgBuy >= 70 && "text-emerald-600",
                          avgBuy >= 40 && avgBuy < 70 && "text-amber-600",
                          avgBuy < 40 && "text-rose-600"
                        )}
                      >
                        {avgBuy}%
                      </span>{" "}
                      avg
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(resultsByCategory)
          .sort(([catA], [catB]) => {
            // Sort categories by intent level priority
            const priority: Record<string, number> = {
              สูงมาก: 1,
              high: 1,
              "very high": 1,
              สูง: 2,
              "medium-high": 2,
              กลาง: 3,
              medium: 3,
              neutral: 3,
              ต่ำ: 4,
              low: 4,
              "medium-low": 4,
              ต่ำมาก: 5,
              "very low": 5,
            };
            const aPriority = priority[catA.toLowerCase()] ?? 999;
            const bPriority = priority[catB.toLowerCase()] ?? 999;
            return aPriority - bPriority;
          })
          .map(([category, posts]) => {
            // Calculate category-level stats
            const totalBuyIntent = posts.reduce((sum, p) => {
              const val =
                typeof p.analysis.ratio_want_to_buy === "string"
                  ? parseInt(p.analysis.ratio_want_to_buy.replace("%", ""), 10)
                  : (p.analysis.ratio_want_to_buy as number || 0);
              return sum + val;
            }, 0);
            const avgBuyIntent = posts.length > 0 ? Math.round(totalBuyIntent / posts.length) : 0;

            // Determine category color based on classification
            const categoryColor =
              category.toLowerCase().includes("สูง") || category.toLowerCase().includes("high")
                ? "emerald"
                : category.toLowerCase().includes("ต่ำ") || category.toLowerCase().includes("low")
                ? "rose"
                : "amber";

            return (
              <div
                key={category}
                className="rounded-lg bg-white border border-slate-200/60 p-2.5 space-y-2 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
                      {category}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                      {posts.length}
                    </span>
                  </div>
                  {avgBuyIntent > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded-md border border-slate-200/50">
                      <span className="text-[8px] font-semibold text-slate-500">Avg</span>
                      <span
                        className={cn(
                          "text-[10px] font-black",
                          avgBuyIntent >= 70 && "text-emerald-600",
                          avgBuyIntent >= 40 && avgBuyIntent < 70 && "text-amber-600",
                          avgBuyIntent < 40 && "text-rose-600"
                        )}
                      >
                        {avgBuyIntent}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {posts.map(({ id, analysis: postAnalysis }, idx) => {
                    // Support both direct ratio fields and intentRatios object
                    const buyIntentRaw = postAnalysis.ratio_want_to_buy ?? postAnalysis.intentRatios?.buyIntent;
                    const buyIntent =
                      typeof buyIntentRaw === "string"
                        ? parseInt(buyIntentRaw.replace("%", ""), 10)
                        : (buyIntentRaw as number || 0);
                    const neutralIntentRaw = postAnalysis.ratio_indifferent ?? postAnalysis.intentRatios?.notInterested;
                    const neutralIntent =
                      typeof neutralIntentRaw === "string"
                        ? parseInt(neutralIntentRaw.replace("%", ""), 10)
                        : (neutralIntentRaw as number || 0);
                    const negativeIntentRaw = postAnalysis.ratio_negative ?? postAnalysis.intentRatios?.negative;
                    const negativeIntent =
                      typeof negativeIntentRaw === "string"
                        ? parseInt(negativeIntentRaw.replace("%", ""), 10)
                        : (negativeIntentRaw as number || 0);

                    return (
                      <div
                        key={id}
                        className="bg-slate-50/50 rounded-lg border border-slate-200/70 p-2.5 shadow-xs space-y-2 hover:border-brand/30 hover:bg-white transition-all duration-200 group relative"
                      >
                        {/* Ranking badge - smaller */}
                        <div className="absolute -top-1 -left-1 size-4 rounded-full bg-linear-to-br from-brand to-brand-strong text-white flex items-center justify-center text-[8px] font-black shadow-sm z-10">
                          {idx + 1}
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-flex w-fit">
                              {id}
                            </span>
                            {postAnalysis.postUrl && (
                              <a
                                href={postAnalysis.postUrl as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-brand hover:text-brand-strong font-medium underline-offset-2 hover:underline inline-flex items-center gap-1"
                              >
                                <span>View Post</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                          {postAnalysis.classification && (
                            <span
                              className={cn(
                                "text-[9px] font-semibold px-2 py-0.5 rounded-md border shrink-0",
                                categoryColor === "emerald" && "text-emerald-700 bg-emerald-50/50 border-emerald-200/50",
                                categoryColor === "rose" && "text-rose-700 bg-rose-50/50 border-rose-200/50",
                                categoryColor === "amber" && "text-amber-700 bg-amber-50/50 border-amber-200/50"
                              )}
                            >
                              {postAnalysis.classification}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-700 leading-relaxed font-medium bg-white rounded-md p-2 border border-slate-200/50">
                          {postAnalysis.summary || "No summary available."}
                        </div>

                        {(buyIntent > 0 || neutralIntent > 0 || negativeIntent > 0) && (
                          <TooltipProvider delay={200}>
                            <div className="pt-0.5 space-y-1">
                              <div className="flex items-center justify-between text-[8px] font-semibold text-slate-500 uppercase tracking-wide">
                                <span>Intent</span>
                              </div>
                              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-slate-100">
                                {buyIntent > 0 && (
                                  <div
                                    className="bg-linear-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                    style={{ width: `${buyIntent}%` }}
                                    title={`Want to Buy: ${buyIntent}%`}
                                  />
                                )}
                                {neutralIntent > 0 && (
                                  <div
                                    className="bg-linear-to-r from-slate-300 to-slate-400 transition-all duration-500"
                                    style={{ width: `${neutralIntent}%` }}
                                    title={`Not Interested: ${neutralIntent}%`}
                                  />
                                )}
                                {negativeIntent > 0 && (
                                  <div
                                    className="bg-linear-to-r from-rose-400 to-rose-500 transition-all duration-500"
                                    style={{ width: `${negativeIntent}%` }}
                                    title={`Negative: ${negativeIntent}%`}
                                  />
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-medium pt-0.5 gap-2">
                                {buyIntent > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-help">
                                      <div className="flex items-center gap-1">
                                        <span className="text-emerald-700 font-semibold">{buyIntent}%</span>
                                        <span className="text-slate-500 text-[8px]">want to buy</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p className="text-xs font-semibold">Want to Buy</p>
                                      <p className="text-xs text-slate-300">
                                        {buyIntent}% of analyzed comments show purchase intent
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {neutralIntent > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-help">
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-600 font-semibold">{neutralIntent}%</span>
                                        <span className="text-slate-500 text-[8px]">not interested</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p className="text-xs font-semibold">Not Interested</p>
                                      <p className="text-xs text-slate-300">
                                        {neutralIntent}% of analyzed comments show neutral/no interest
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {negativeIntent > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-help">
                                      <div className="flex items-center gap-1">
                                        <span className="text-rose-600 font-semibold">{negativeIntent}%</span>
                                        <span className="text-slate-500 text-[8px]">negative</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p className="text-xs font-semibold">Negative Intent</p>
                                      <p className="text-xs text-slate-300">
                                        {negativeIntent}% of analyzed comments show negative sentiment
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </TooltipProvider>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
