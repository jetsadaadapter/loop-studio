"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Database, Cpu, BrainCircuit, BarChart3, Terminal, ShieldAlert, AlertTriangle } from "lucide-react";
import type { ToolRunGrouped } from "@/core/interfaces/tools.interface";
import { getJobStatus } from "../tool-job-utils";
import { getPluginConfig } from "../plugin-config";

interface ProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName?: string;
  isJobComplete?: boolean;
  activeRun?: ToolRunGrouped;
}

const PIPELINE_STEPS = [
  { icon: Database, label: "Queuing scraper job", sublabel: "Preparing data pipeline..." },
  { icon: Cpu, label: "Scraper is running", sublabel: "Fetching source data from APIs..." },
  { icon: BrainCircuit, label: "AI analysis in progress", sublabel: "Processing with language model..." },
  { icon: BarChart3, label: "Finalizing results", sublabel: "Structuring output data..." },
];

const getStepStyles = (status: string) => {
  switch (status) {
    case "completed":
      return {
        card: "bg-emerald-50/45 border-emerald-200/60 shadow-2xs",
        iconContainer: "bg-emerald-100 text-emerald-600",
        label: "text-emerald-800 font-bold",
        sublabel: "text-emerald-600/70 font-semibold"
      };
    case "active":
    case "running":
      return {
        card: "bg-indigo-50/70 border-indigo-200 shadow-sm",
        iconContainer: "bg-indigo-100 text-indigo-600 animate-pulse",
        label: "text-indigo-900 font-black",
        sublabel: "text-indigo-600 font-medium"
      };
    case "waiting":
      return {
        card: "bg-purple-50/30 border-purple-150/50 opacity-80 shadow-3xs",
        iconContainer: "bg-purple-100/80 text-purple-600 animate-pulse",
        label: "text-purple-800 font-bold",
        sublabel: "text-purple-500 font-medium"
      };
    case "failed":
      return {
        card: "bg-rose-50/60 border-rose-200 text-rose-600 shadow-xs",
        iconContainer: "bg-rose-100 text-rose-600",
        label: "text-rose-800 font-bold",
        sublabel: "text-rose-550 font-medium"
      };
    case "cancelled":
      return {
        card: "bg-slate-50/50 border-slate-200/60 opacity-60 shadow-3xs",
        iconContainer: "bg-slate-100 text-slate-400",
        label: "text-slate-500 font-bold",
        sublabel: "text-slate-400 font-medium"
      };
    case "queued":
    default:
      return {
        card: "bg-slate-50/50 border-slate-100 opacity-40",
        iconContainer: "bg-slate-100 text-slate-400",
        label: "text-slate-400 font-bold",
        sublabel: "text-slate-350 font-medium"
      };
  }
};

const getStepSublabel = (status: string, plugin: string, error?: string | null | Record<string, unknown>) => {
  if (status === "completed") {
    return "Stage completed successfully";
  }
  if (status === "cancelled") {
    if (error) {
      const errMsg = typeof error === "string" ? error : (error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : JSON.stringify(error));
      const cleanMsg = errMsg.replace(/^cancelled:\s*upstream\s*job\s*\w+\s*\([^)]+\)\s*failed\s*—\s*/i, "");
      return cleanMsg.length > 50 ? `${cleanMsg.slice(0, 47)}...` : cleanMsg;
    }
    return "Job was cancelled";
  }
  if (status === "failed") {
    if (error) {
      const errMsg = typeof error === "string" ? error : (error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : JSON.stringify(error));
      return errMsg.length > 40 ? `${errMsg.slice(0, 37)}...` : errMsg;
    }
    return "An error occurred in this stage";
  }
  if (status === "active" || status === "running") {
    return plugin.toLowerCase() === "apify" ? "Fetching data from source..." : "AI processing in progress...";
  }
  if (status === "waiting") {
    return "Awaiting execution queue...";
  }
  return "Awaiting pipeline trigger...";
};

export function ProcessingModal({ open, onOpenChange, toolName, isJobComplete, activeRun }: ProcessingModalProps) {
  const [step, setStep] = useState(0);

  const runStatus = activeRun ? getJobStatus(activeRun) : (isJobComplete ? "completed" : "active");
  const isFailed = runStatus === "failed";
  const isSuccess = runStatus === "completed";
  const isDone = isSuccess || isFailed;

  const currentStep = isSuccess ? PIPELINE_STEPS.length - 1 : step;

  // Animation pipeline — steps advance on timers when activeRun is not loaded yet
  useEffect(() => {
    if (!open || activeRun) return;

    const delays = [1000, 2800, 5000, 6600];
    const timers: ReturnType<typeof setTimeout>[] = [];

    delays.forEach((delay, i) => {
      const t = setTimeout(() => setStep(i), delay);
      timers.push(t);
    });

    return () => {
      timers.forEach(clearTimeout);
      setStep(0);
    };
  }, [open, activeRun]);

  // Job complete signal from parent (API polling) → close after a short delay (success only)
  useEffect(() => {
    if (!isSuccess || !open) return;
    const t = setTimeout(() => onOpenChange(false), 2000);
    return () => clearTimeout(t);
  }, [isSuccess, open, onOpenChange]);

  if (!open) return null;

  const sortedJobs = activeRun?.jobs
    ? [...activeRun.jobs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Top gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-brand via-indigo-500 to-violet-500" />

        <div className="p-7 pb-8 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="relative size-8 shrink-0 flex items-center justify-center">
                {isFailed ? (
                  <ShieldAlert className="size-8 text-rose-500 animate-bounce" />
                ) : isSuccess ? (
                  <CheckCircle2 className="size-8 text-emerald-500" />
                ) : (
                  <>
                    <Loader2 className="size-8 text-brand animate-spin" />
                    <span className="absolute inset-0 rounded-full bg-brand/10 animate-ping" />
                  </>
                )}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {isFailed ? "Job Execution Failed" : isSuccess ? "Job Completed Successfully" : "Processing Scraper Data"}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {toolName ?? "Automation job"} · {isFailed ? "Execution failed" : isSuccess ? "Done" : "This may take a few minutes"}
                </p>
              </div>
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="space-y-3">
            {sortedJobs.length > 0 ? (
              sortedJobs.map((s, i) => {
                const subStatus = getJobStatus(s);
                const styles = getStepStyles(subStatus);
                const pluginConfig = getPluginConfig(s.plugin || "");
                const label = s.label || s.script?.label || pluginConfig.stepTitle;
                const sublabel = getStepSublabel(subStatus, s.plugin || "", s.error);
                const isActive = subStatus === "active" || subStatus === "running";

                return (
                  <div
                    key={s.id || s.jobId || i}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-500",
                      styles.card
                    )}
                  >
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                        styles.iconContainer
                      )}
                    >
                      {subStatus === "completed" ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : subStatus === "failed" ? (
                        <AlertTriangle className="size-3.5" />
                      ) : pluginConfig.iconSrc ? (
                        <Image
                          src={pluginConfig.iconSrc}
                          alt={label}
                          width={14}
                          height={14}
                          className={cn("size-3.5 object-contain select-none", isActive && "animate-pulse")}
                        />
                      ) : (
                        <Terminal className="size-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold leading-none truncate", styles.label)}>
                        {label}
                      </p>
                      <p className={cn("text-[10px] mt-0.5 truncate", styles.sublabel)}>
                        {sublabel}
                      </p>
                    </div>
                    {isActive && (
                      <span className="shrink-0 size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>
                );
              })
            ) : (
              PIPELINE_STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === currentStep && !isDone;
                const isPast = i < currentStep || isDone;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-500",
                      isActive
                        ? "bg-indigo-50/60 border-indigo-200 shadow-sm"
                        : isPast
                        ? "bg-emerald-50/40 border-emerald-200/60"
                        : "bg-slate-50/50 border-slate-100 opacity-40"
                    )}
                  >
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                        isActive ? "bg-indigo-100 text-indigo-600" : isPast ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {isPast && !isActive ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <Icon className={cn("size-3.5", isActive && "animate-pulse")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold leading-none", isActive ? "text-slate-800" : isPast ? "text-slate-600" : "text-slate-400")}>
                        {s.label}
                      </p>
                      <p className={cn("text-[10px] font-medium mt-0.5", isActive ? "text-slate-500" : "text-slate-350")}>
                        {s.sublabel}
                      </p>
                    </div>
                    {isActive && (
                      <span className="shrink-0 size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="space-y-4">
            <p className="text-[10px] text-slate-400 font-medium text-center leading-normal">
              {isDone
                ? (isFailed ? "The job encountered an error. Check Run History for logs." : "Your job completed successfully. Check Run History for results.")
                : "You can close this window — the job will continue running in the background."}
            </p>
            {isFailed && (
              <button
                onClick={() => onOpenChange(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm text-center"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
