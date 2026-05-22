"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Database, Cpu, BrainCircuit, BarChart3 } from "lucide-react";

interface ProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName?: string;
  isJobComplete?: boolean;
}

const PIPELINE_STEPS = [
  { icon: Database, label: "Queuing scraper job", sublabel: "Preparing data pipeline..." },
  { icon: Cpu, label: "Scraper is running", sublabel: "Fetching source data from APIs..." },
  { icon: BrainCircuit, label: "AI analysis in progress", sublabel: "Processing with language model..." },
  { icon: BarChart3, label: "Finalizing results", sublabel: "Structuring output data..." },
];

export function ProcessingModal({ open, onOpenChange, toolName, isJobComplete }: ProcessingModalProps) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Animation pipeline — steps advance on timers, but no auto-close
  useEffect(() => {
    if (!open) {
      setStep(0);
      setDone(false);
      return;
    }

    const delays = [1000, 2800, 5000, 6600];
    //              step0 step1 step2 step3
    const timers: ReturnType<typeof setTimeout>[] = [];

    delays.forEach((delay, i) => {
      const t = setTimeout(() => setStep(i), delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Job complete signal from parent (API polling) → show success and close
  useEffect(() => {
    if (!isJobComplete || !open) return;
    setStep(PIPELINE_STEPS.length - 1);
    setDone(true);
    const t = setTimeout(() => onOpenChange(false), 1800);
    return () => clearTimeout(t);
  }, [isJobComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

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
                {done ? (
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
                  {done ? "Job Queued Successfully" : "Processing Scraper Data"}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {toolName ?? "Automation job"} · This may take a few minutes
                </p>
              </div>
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="space-y-3">
            {PIPELINE_STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step && !done;
              const isPast = i < step || done;
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
            })}
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-slate-400 font-medium text-center leading-normal">
            {done
              ? "Your job has been queued. Check Job History for live updates."
              : "You can close this window — the job will continue running in the background."}
          </p>
        </div>
      </div>
    </div>
  );
}
