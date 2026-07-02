"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Share2,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { getJobStatus, getItemCount } from "../../../tool-job-utils";
import { ExportDatasetModal } from "../export/export-dataset-modal";

interface ConsoleHeaderProps {
  job: ToolJob;
  toolName: string;
  onClose: () => void;
}

export function ConsoleHeader({ job, toolName, onClose }: ConsoleHeaderProps) {
  const { pushToast } = useToast();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const status = getJobStatus(job);
  const itemCount = getItemCount(job);
  const pluginLower = String(job.plugin || "").toLowerCase();
  const getSafeDate = (val: unknown): Date => {
    if (!val) return new Date();
    const d = new Date(val as string | number | Date);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  };

  const startTime = getSafeDate(job.createdAt);

  const getFormattedTime = (dateObj: Date): string => {
    try {
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleString("sv-SE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).replace("T", " ");
      }
    } catch { }
    return "Unknown time";
  };

  const formattedTime = getFormattedTime(startTime);

  const getDurationSec = () => {
    try {
      if (job.updatedAt && job.createdAt) {
        const end = new Date(job.updatedAt).getTime();
        const start = new Date(job.createdAt).getTime();
        if (!isNaN(end) && !isNaN(start)) {
          return Math.max(1, Math.round((end - start) / 1000));
        }
      }
    } catch { }
    return 28;
  };

  const durationSec = getDurationSec();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Apify Actor Run - ${toolName}`,
          text: `Check out this Apify actor run dataset logs for ${toolName}.`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        pushToast("Link copied to clipboard!", "success");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        pushToast("Failed to share.", "error");
      }
    }
  };

  return (
    <div className="bg-white border-b border-slate-200/80 text-slate-800 flex flex-col select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            <span>Back</span>
          </button>

          <span className="text-slate-200">|</span>

          <div className="flex items-center gap-2 min-w-0">
            <div className="size-5 bg-brand rounded-md flex items-center justify-center text-white shadow-xs shrink-0">
              <Terminal className="size-3" />
            </div>
            <span className="font-bold text-sm text-slate-800 truncate max-w-[120px] sm:max-w-none">{toolName}</span>
            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider scale-90 shrink-0">
              Actor
            </span>
          </div>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Share button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md text-xs font-semibold px-3 gap-1.5 cursor-pointer shadow-xs"
          >
            <Share2 className="size-3.5 text-slate-400" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Export button */}
          <Button
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="h-8 bg-brand hover:bg-brand/90 text-white rounded-md text-xs font-bold px-4 gap-1.5 border-none cursor-pointer shadow-sm"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          {status === "completed" ? (
            <div className="flex items-center gap-1 bg-emerald-500 text-white shadow-xs shadow-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="size-3" />
              <span>Succeeded</span>
            </div>
          ) : status === "failed" ? (
            <div className="flex items-center gap-1 bg-rose-500 text-white shadow-xs shadow-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <XCircle className="size-3" />
              <span>Failed</span>
            </div>
          ) : status === "queued" ? (
            <div className="flex items-center gap-1 bg-blue-500 text-white shadow-xs shadow-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <Loader2 className="size-3 animate-spin" />
              <span>Queued</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-amber-500 text-white shadow-xs shadow-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <Loader2 className="size-3 animate-spin" />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="font-semibold text-slate-700">
          {status === "completed" && (() => {
            if (pluginLower === "apify") return `Finished! Total ${itemCount} posts scraped.`;
            if (pluginLower === "gemini") return `Finished! Total ${itemCount} posts analyzed.`;
            return `Finished! Total ${itemCount} items processed.`;
          })()}
          {status === "failed" && `Finished with errors. Check log for details.`}
          {(status === "running" || status === "active" || status === "queued") && (() => {
            if (status === "queued") return `Job is queued in the pipeline...`;
            if (pluginLower === "apify") return `Scraping posts in progress...`;
            if (pluginLower === "gemini") return `Analyzing posts in progress...`;
            return `Processing items in progress...`;
          })()}
        </div>

        {job.createdAt && (
          <>
            <span className="text-slate-300 hidden sm:inline">•</span>
            {/* Timestamp */}
            {(() => {
              const isToday = (() => {
                const date = new Date(job.createdAt);
                if (isNaN(date.getTime())) return false;
                const today = new Date();
                return date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
              })();
              if (isToday) {
                return (
                  <div className="font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 text-[10px] shadow-3xs">
                    {formattedTime} (Today)
                  </div>
                );
              }
              return <div className="font-medium">{formattedTime}</div>;
            })()}
          </>
        )}

        {job.createdAt && job.updatedAt && (
          <>
            <span className="text-slate-300 hidden sm:inline">•</span>
            {/* Duration */}
            <div className="font-medium">{durationSec} s</div>
          </>
        )}
      </div>

      <ExportDatasetModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        job={job}
      />
    </div>
  );
}
