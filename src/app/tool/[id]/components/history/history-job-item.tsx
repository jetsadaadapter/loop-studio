"use client";

import { useState } from "react";
import Image from "next/image";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { ChevronRight, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getJobStatus, getItemCount } from "../../tool-job-utils";
import { JobStatusBadge } from "../job-status-badge";
import { getPluginConfig } from "../../plugin-config";

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
  const leftAccentTone =
    status === "completed"
      ? "bg-emerald-300"
      : status === "failed"
        ? "bg-rose-300"
        : status === "queued" || status === "active" || status === "running"
          ? "bg-amber-300"
          : "bg-slate-200";

  const pluginLower = String(job.plugin || "").toLowerCase();
  const pluginConfig = getPluginConfig(pluginLower);
  const friendlyTitle = pluginConfig.cardTitle;
  const runId = job.runId || "";
  const slicedId = job.runId ? `#${job.runId.split("-")[0].toUpperCase().slice(0, 8)}` : "";
  const subJobs = (job as { jobs?: ToolJob[] }).jobs || [];

  // Plugin icons are rendered directly using SVG Image components below

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
      className={cn(
        "w-full text-left transition-all duration-300 flex items-center justify-between group cursor-pointer relative overflow-hidden select-none outline-none hover:-translate-y-0.5 active:scale-[0.98] rounded-2xl border",
        isMobile ? "p-3" : "p-3.5",
        isSelected
          ? "bg-white border-brand shadow-[0_8px_24px_rgba(194,0,25,0.08)] ring-1 ring-brand/10"
          : "bg-white border-slate-200/80 hover:border-slate-350 hover:bg-slate-50/50 hover:shadow-xs"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-2 bottom-2 w-1 rounded-r-full",
          leftAccentTone,
          isSelected && "shadow-[0_0_0_1px_rgba(194,0,25,0.25)]",
        )}
      />

      <div className={cn("min-w-0 w-full", isSelected && "pl-1.5")}>
        {/* Top Row: Title + ID (Left), Status + compact dots (Right) */}
        <div className="flex items-center gap-2 w-full justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {pluginConfig.iconSrc ? (
              <Image
                src={pluginConfig.iconSrc}
                alt={pluginConfig.cardTitle}
                width={14}
                height={14}
                className={cn("size-3.5 shrink-0 object-contain select-none", pluginConfig.iconAnimate && "animate-pulse")}
              />
            ) : (
              <Terminal className="size-3.5 shrink-0 text-slate-500/90" />
            )}
            <h4 className="text-xs font-bold text-slate-800 tracking-tight truncate leading-none">
              {friendlyTitle}
            </h4>
            {slicedId && (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-extrabold tracking-wider rounded-md select-none shrink-0 border border-slate-200/40 uppercase">
                {slicedId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <JobStatusBadge status={status} />

            {subJobs.length > 0 && (
              <div className="flex items-center gap-0.5 shrink-0">
                {subJobs.map((sub, idx) => {
                  const subStatus = getJobStatus(sub);
                  return (
                    <div
                      key={sub.id || sub.jobId || idx}
                      title={`${sub.plugin || "Job"}: ${subStatus}`}
                      className={cn(
                        "size-1.5 rounded-full transition-all duration-300 shrink-0",
                        subStatus === "completed" ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.25)]" :
                          subStatus === "active" || subStatus === "running" ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.25)] animate-pulse" :
                            subStatus === "queued" ? "bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.25)] animate-pulse" :
                              subStatus === "failed" ? "bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.25)]" : "bg-slate-200"
                      )}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Pipeline Trigger (Left), Time Elapsed (Right) */}
        <div className="flex items-center justify-between gap-3 mt-3 w-full">
          {/* Pipeline Interactive Trigger Button */}
          {subJobs.length > 0 ? (
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
            ) : <div />}

          {/* Time Elapsed */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "text-[9px] px-2.5 py-1 rounded-full border font-bold shadow-3xs leading-none",
                isTodayRun
                  ? "text-slate-600 bg-slate-50 border-slate-200/70"
                  : "text-slate-550 bg-slate-50/80 border-slate-200/80",
              )}
            >
              {formattedTime}
            </span>
            <ChevronRight
              className={cn(
                "size-3.5 transition-all duration-300 group-hover:translate-x-0.5",
                isSelected ? "text-brand" : "text-slate-300 group-hover:text-slate-450",
              )}
            />
          </div>
        </div>

        {/* Expandable Pipeline Timeline (Aligned with the attached UI) */}
        {(() => {
          if (!isPipelineExpanded || !subJobs || subJobs.length === 0) return null;
          return (
            <div
              onClick={(e) => e.stopPropagation()} // Prevent clicking timeline from selecting card
              className="mt-4 pt-4 border-t border-slate-100/60 flex flex-col gap-4 relative pl-5 select-none"
            >
              <div className="absolute left-6.5 top-0 bottom-0 bg-slate-100 border-l border-dashed border-slate-300" />

              {subJobs.map((sub, idx) => {
                const subStatus = getJobStatus(sub);
                const subPluginLower = String(sub.plugin || "").toLowerCase();
                const subPluginConfig = getPluginConfig(subPluginLower);
                const subFriendlyTitle = subPluginConfig.stepTitle;

                const subTimeStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                }) : "just now";

                // Sub-job timeline icons are rendered directly using SVG Image components below

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
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {subPluginConfig.iconSrc ? (
                          <Image
                            src={subPluginConfig.iconSrc}
                            alt={subPluginConfig.stepTitle}
                            width={12}
                            height={12}
                            className={cn("size-3 shrink-0 object-contain select-none", subPluginConfig.iconAnimate && "animate-pulse")}
                          />
                        ) : (
                          <Terminal className="size-3 shrink-0 text-slate-400/80" />
                        )}
                        <span className="text-[10px] font-extrabold text-slate-700 tracking-tight leading-none truncate">
                          {subFriendlyTitle}
                        </span>
                        {subStatus === "completed" && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[8.5px] font-black select-none tracking-wider uppercase shrink-0">
                            completed
                          </span>
                        )}
                        {(subStatus === "active" || subStatus === "running") && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[8.5px] font-black select-none tracking-wider uppercase animate-pulse shrink-0">
                            running
                          </span>
                        )}
                        {subStatus === "queued" && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[8.5px] font-black select-none tracking-wider uppercase animate-pulse shrink-0">
                            queued
                          </span>
                        )}
                        {subStatus === "failed" && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 text-[8.5px] font-black select-none tracking-wider uppercase shrink-0">
                            failed
                          </span>
                        )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold leading-none shrink-0">
                          {subTimeStr}
                        </span>
                      </div>

                      {subCount > 0 && (
                        <div className="mt-1 pl-4.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[8.5px] font-black select-none tracking-wider uppercase">
                            {subPluginLower === "apify" ? `${subCount} Scraped` : `${subCount} Analyzed`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

    </div>
  );
}
