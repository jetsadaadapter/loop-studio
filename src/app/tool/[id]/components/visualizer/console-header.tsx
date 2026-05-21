"use client";

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
import { getJobStatus, getItemCount } from "../../tool-job-utils";

interface ConsoleHeaderProps {
  job: ToolJob;
  toolName: string;
  onClose: () => void;
}

export function ConsoleHeader({ job, toolName, onClose }: ConsoleHeaderProps) {
  const { pushToast } = useToast();
  const status = getJobStatus(job);
  const itemCount = getItemCount(job);
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
    } catch {}
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
    } catch {}
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
    <div className="bg-[#0b0c0e] border-b border-zinc-800 text-zinc-100 flex flex-col select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors font-semibold text-sm cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            <span>Run</span>
          </button>
          
          <span className="text-zinc-600">|</span>

          <div className="flex items-center gap-2">
            <div className="size-6 bg-blue-600 rounded-md flex items-center justify-center text-white">
              <Terminal className="size-3.5" />
            </div>
            <span className="font-bold text-sm text-zinc-200">{toolName}</span>
            <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold rounded-md uppercase tracking-wider scale-90">
              Actor
            </span>
          </div>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center gap-2">
          {/* Share button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="h-8 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-md text-xs font-semibold px-3 gap-1.5 cursor-pointer"
          >
            <Share2 className="size-3.5 text-zinc-400" />
            <span>Share</span>
          </Button>

          {/* Export button */}
          <Button 
            size="sm" 
            className="h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold px-4 gap-1.5 border-none cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="bg-[#121316] border-t border-zinc-800 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-400">
        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          {status === "completed" ? (
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="size-3" />
              <span>Succeeded</span>
            </div>
          ) : status === "failed" ? (
            <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <XCircle className="size-3" />
              <span>Failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <Loader2 className="size-3 animate-spin" />
              <span>Running</span>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="font-medium text-zinc-300">
          {status === "completed" && `Finished! Total ${itemCount} items processed.`}
          {status === "failed" && `Finished with errors. Check log for details.`}
          {status === "running" && `Processing items in progress...`}
        </div>

        {job.createdAt && (
          <>
            <span className="text-zinc-800">•</span>
            {/* Timestamp */}
            <div>{formattedTime}</div>
          </>
        )}

        {job.createdAt && job.updatedAt && (
          <>
            <span className="text-zinc-800">•</span>
            {/* Duration */}
            <div>{durationSec} s</div>
          </>
        )}
      </div>
    </div>
  );
}
