"use client";

import { useState } from "react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { ChevronRight, ChevronDown, ChevronUp, Globe, Sparkles, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getJobStatus, getItemCount } from "../../tool-job-utils";

interface HistoryJobItemProps {
  job: ToolJob;
  isSelected: boolean;
  isMobile?: boolean;
  onSelect: (jobId: string) => void;
}

export function HistoryJobItem({
  job,
  isSelected,
  isMobile = false,
  onSelect,
}: HistoryJobItemProps) {
  const [isPipelineExpanded, setIsPipelineExpanded] = useState(false);
  const status = getJobStatus(job);

  const pluginLower = String(job.plugin || "").toLowerCase();
  const friendlyTitle =
    pluginLower === "apify"
      ? "Apify Post Scraper"
      : pluginLower === "gemini"
        ? "Gemini AI Analysis"
        : "Automation Run";
  const runId = job.runId || "";
  const slicedId = job.runId ? `#${job.runId.split("-")[0].toUpperCase().slice(0, 8)}` : "";

  const PluginIcon =
    pluginLower === "apify"
      ? Globe
      : pluginLower === "gemini"
        ? Sparkles
        : Terminal;

  const formattedTime = (() => {
    if (!job.createdAt) return "just now";
    const date = new Date(job.createdAt);
    if (isNaN(date.getTime())) return "just now";
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "just now";
    }
  })();

  const isTodayRun = (() => {
    if (!job.createdAt) return false;
    const date = new Date(job.createdAt);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  })();

  return (
    <div
      onClick={() => onSelect(runId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(runId);
        }
      }}
      className={cn(
        "w-full text-left transition-all duration-300 flex items-center justify-between group cursor-pointer relative overflow-hidden select-none outline-none hover:-translate-y-0.5 active:scale-[0.98] rounded-2xl border",
        isMobile ? "p-3" : "p-3.5",
        isSelected
          ? "bg-white border-brand shadow-[0_8px_24px_rgba(194,0,25,0.08)] ring-1 ring-brand/10"
          : "bg-white border-slate-200/80 hover:border-slate-350 hover:bg-slate-50/50 hover:shadow-xs"
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand to-brand-strong" />
      )}

      <div className={cn("min-w-0 w-full", isSelected && "pl-1.5")}>
        {/* Top Row: Title + ID (Left), Status Badge (Right) */}
        <div className="flex items-center gap-2 w-full justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <PluginIcon
              className={cn(
                "size-3.5 shrink-0",
                pluginLower === "apify" ? "text-indigo-500/90" :
                  pluginLower === "gemini" ? "text-purple-500/90" :
                    "text-slate-500/90"
              )}
            />
            <h4 className="text-xs font-bold text-slate-800 tracking-tight truncate leading-none">
              {friendlyTitle}
            </h4>
            {slicedId && (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-extrabold tracking-wider rounded-md select-none shrink-0 border border-slate-200/40 uppercase">
                {slicedId}
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase select-none tracking-wider transition-all duration-205 shrink-0",
              status === "completed"
                ? "bg-emerald-50/60 border-emerald-200/50 text-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.08)]"
                : status === "running" || status === "active"
                  ? "bg-amber-50/60 border-amber-200/50 text-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.08)] animate-pulse"
                  : status === "queued"
                    ? "bg-blue-50/60 border-blue-200/50 text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.08)] animate-pulse"
                    : status === "failed"
                      ? "bg-rose-50/60 border-rose-200/50 text-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.08)]"
                      : "bg-slate-50 border-slate-200 text-slate-500"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                status === "completed"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                  : status === "running" || status === "active"
                    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse"
                    : status === "queued"
                      ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse"
                      : status === "failed"
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                        : "bg-slate-400"
              )}
            />
            <span>{status}</span>
          </div>
        </div>

        {/* Dynamic Segmented Progress Bar (Sleek Horizontal Capsules like Image 2) */}
        {(() => {
          const subJobs = (job as { jobs?: ToolJob[] }).jobs;
          if (!subJobs || subJobs.length === 0) return null;
          return (
            <div className="flex items-center gap-1 w-full mt-2.5">
              {subJobs.map((sub, idx) => {
                const subStatus = getJobStatus(sub);
                return (
                  <div
                    key={sub.id || sub.jobId || idx}
                    title={`${sub.plugin || "Job"}: ${subStatus}`}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      subStatus === "completed" ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.25)]" :
                        subStatus === "active" || subStatus === "running" ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.25)] animate-pulse" :
                          subStatus === "queued" ? "bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.25)] animate-pulse" :
                            subStatus === "failed" ? "bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.25)]" : "bg-slate-200/60"
                    )}
                  />
                );
              })}
            </div>
          );
        })()}

        {/* Bottom Row: Pipeline Trigger (Left), Time Elapsed (Right) */}
        <div className="flex items-center justify-between gap-3 mt-3 w-full">
          {/* Pipeline Interactive Trigger Button */}
          {(() => {
            const subJobs = (job as { jobs?: ToolJob[] }).jobs;
            if (!subJobs || subJobs.length === 0) return <div />; // Keep layout balanced
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPipelineExpanded(!isPipelineExpanded);
                }}
                className={cn(
                  "group/btn flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 border border-slate-200/40 rounded-full px-2.5 py-0.5 shadow-3xs select-none cursor-pointer transition-all active:scale-95 duration-200",
                  isPipelineExpanded && "bg-slate-100 border-slate-350"
                )}
              >
                <span className="text-[7.5px] font-black text-slate-455 uppercase tracking-widest leading-none">Pipeline Steps</span>
                {isPipelineExpanded ? (
                  <ChevronUp className="size-2.5 text-slate-400 group-hover/btn:text-slate-500 transition-colors" />
                ) : (
                  <ChevronDown className="size-2.5 text-slate-400 group-hover/btn:text-slate-500 transition-colors" />
                )}
              </button>
            );
          })()}

          {/* Time Elapsed */}
          {isTodayRun ? (
            <span className="text-[8.5px] text-slate-600 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-md font-bold shrink-0 shadow-3xs">
              {formattedTime}
            </span>
          ) : (
            <span className="text-[9px] text-slate-450 font-semibold shrink-0">
              {formattedTime}
            </span>
          )}
        </div>

        {/* Expandable Pipeline Timeline (Aligned with the attached UI) */}
        {(() => {
          const subJobs = (job as { jobs?: ToolJob[] }).jobs;
          if (!isPipelineExpanded || !subJobs || subJobs.length === 0) return null;
          return (
            <div
              onClick={(e) => e.stopPropagation()} // Prevent clicking timeline from selecting card
              className="mt-4 pt-4 border-t border-slate-100/60 flex flex-col gap-4 relative pl-5 select-none"
            >
              {/* Vertical timeline line */}
              <div className="absolute left-[26px] top-6 bottom-6 bg-slate-100 border-l border-dashed border-slate-300" />

              {subJobs.map((sub, idx) => {
                const subStatus = getJobStatus(sub);
                const subPluginLower = String(sub.plugin || "").toLowerCase();
                const subFriendlyTitle =
                  subPluginLower === "apify"
                    ? "Apify Scraper Engine"
                    : subPluginLower === "gemini"
                      ? "Gemini AI Analysis"
                      : "Automation Stage";

                const subTimeStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                }) : "just now";

                const SubPluginIcon =
                  subPluginLower === "apify"
                    ? Globe
                    : subPluginLower === "gemini"
                      ? Sparkles
                      : Terminal;

                const subCount = getItemCount(sub);

                return (
                  <div key={sub.id || sub.jobId || idx} className="flex items-start gap-3 relative min-w-0">
                    {/* Timeline circle node */}
                    <div className="relative z-10 flex items-center justify-center size-3.5 bg-white border border-slate-300 rounded-full mt-0.5 shadow-3xs shrink-0">
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          subStatus === "completed" ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" :
                            subStatus === "active" || subStatus === "running" ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)] animate-pulse" :
                              subStatus === "queued" ? "bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)] animate-pulse" :
                                subStatus === "failed" ? "bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]" : "bg-slate-300"
                        )}
                      />
                    </div>

                    {/* Step details */}
                    <div className="flex-1 min-w-0 text-left space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <SubPluginIcon
                          className={cn(
                            "size-3 shrink-0",
                            subPluginLower === "apify" ? "text-indigo-500/80" :
                              subPluginLower === "gemini" ? "text-purple-500/80" :
                                "text-slate-400/80"
                          )}
                        />
                        <span className="text-[10px] font-extrabold text-slate-700 tracking-tight leading-none truncate">
                          {subFriendlyTitle}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold leading-none">
                          • {subTimeStr}
                        </span>
                      </div>

                      {/* Tags block matching the attached UI design */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Status:</span>

                        {/* Premium status badges matching attached UI colors */}
                        {subStatus === "completed" && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[8.5px] font-black select-none tracking-wider uppercase">
                            completed
                          </span>
                        )}
                        {(subStatus === "active" || subStatus === "running") && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/50 text-[8.5px] font-black select-none tracking-wider uppercase animate-pulse">
                            running
                          </span>
                        )}
                        {subStatus === "queued" && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/50 text-[8.5px] font-black select-none tracking-wider uppercase animate-pulse">
                            queued
                          </span>
                        )}
                        {subStatus === "failed" && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/50 text-[8.5px] font-black select-none tracking-wider uppercase">
                            failed
                          </span>
                        )}

                        {/* Details Badge showing count / output metric */}
                        {subCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[8.5px] font-black select-none tracking-wider uppercase">
                            {subPluginLower === "apify" ? `${subCount} Scraped` : `${subCount} Analyzed`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <div className="pl-1 shrink-0 flex items-center">
        <ChevronRight
          className={cn(
            "size-4 transition-all duration-300 group-hover:translate-x-0.5",
            isSelected ? "text-brand" : "text-slate-300 group-hover:text-slate-450"
          )}
        />
      </div>
    </div>
  );
}
