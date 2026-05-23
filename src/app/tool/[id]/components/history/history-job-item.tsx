"use client";

import type { ToolJob } from "@/core/interfaces/tools.interface";
import { ChevronRight } from "lucide-react";
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
  const status = getJobStatus(job);

  const pluginLower = String(job.plugin || "").toLowerCase();
  const friendlyTitle =
    pluginLower === "apify"
      ? "Apify Post Scraper"
      : pluginLower === "gemini"
        ? "Gemini AI Analysis"
        : "Automation Run";
  const rawId = job.jobId || job._id || "";
  const slicedId = rawId ? `#${rawId.split("-")[0].slice(0, 8)}` : "";

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

  return (
    <div
      onClick={() => onSelect(rawId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(rawId);
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
        <div className="flex items-center gap-2 w-full justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 tracking-tight truncate leading-none">
              {friendlyTitle}
            </h4>
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-extrabold tracking-wider rounded-md select-none shrink-0 border border-slate-200/40 uppercase">
              {slicedId}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold shrink-0">
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2.5">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase select-none tracking-wider transition-all duration-200",
              status === "completed"
                ? "bg-emerald-50/60 border-emerald-200/50 text-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.08)]"
                : status === "running"
                  ? "bg-amber-50/60 border-amber-200/50 text-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.08)]"
                  : status === "failed"
                    ? "bg-rose-50/60 border-rose-200/50 text-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.08)]"
                    : "bg-slate-50 border-slate-200 text-slate-500"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                status === "completed"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                  : status === "running"
                    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse"
                    : status === "failed"
                      ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse"
                      : "bg-slate-400"
              )}
            />
            <span>{status}</span>
          </div>
          <span className="text-slate-200 select-none">•</span>
          <span className="text-[10px] text-slate-500 font-bold">
            {getItemCount(job)} items
          </span>
        </div>
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
