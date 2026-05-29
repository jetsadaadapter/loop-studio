"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Terminal, ArrowLeft, Loader2, 
  Play, ShieldAlert, ChevronRight, Download,
  Maximize2, Minimize2
} from "lucide-react";
import type { Tool, ToolJob, ToolRun } from "@/core/interfaces/tools.interface";
import { getToolJob } from "@/core/services/tools.service";
import { AppCover } from "@/components/app-cover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getJobStatus, getItemCount } from "../../tool-job-utils";
import { ExportDatasetModal } from "../../components/visualizer/export-dataset-modal";

// Reuse existing high-quality visualizer components
import { ConsoleNavigation, type VisualizerTab } from "../../components/visualizer/console-navigation";
import { TabOutput } from "../../components/visualizer/tab-output";
import { TabLog } from "../../components/visualizer/tab-log";
import { TabInputStorage } from "../../components/visualizer/tab-input-storage";

interface RunClientProps {
  tool: Tool;
  run: ToolRun;
  runId: string;
}

const STATUS_COLORS: Record<string, { base: string; text: string; bg: string; dot: string }> = {
  completed: { 
    base: "bg-emerald-500", 
    text: "text-emerald-600", 
    bg: "bg-emerald-50/60 border-emerald-200/50 shadow-[0_0_8px_rgba(16,185,129,0.08)]",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
  },
  active: { 
    base: "bg-amber-550 animate-pulse", 
    text: "text-amber-600", 
    bg: "bg-amber-50/60 border-amber-200/50 shadow-[0_0_8px_rgba(245,158,11,0.08)]",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse"
  },
  running: { 
    base: "bg-amber-550 animate-pulse", 
    text: "text-amber-600", 
    bg: "bg-amber-50/60 border-amber-200/50 shadow-[0_0_8px_rgba(245,158,11,0.08)]",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse"
  },
  failed: { 
    base: "bg-rose-500", 
    text: "text-rose-600", 
    bg: "bg-rose-50/60 border-rose-200/50 shadow-[0_0_8px_rgba(244,63,94,0.08)]",
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse"
  },
  queued: { 
    base: "bg-blue-500/80 animate-pulse", 
    text: "text-blue-600", 
    bg: "bg-blue-50/60 border-blue-200/50 shadow-[0_0_8px_rgba(59,130,246,0.08)]",
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse"
  },
};

export function RunClient({ tool, run, runId }: RunClientProps) {
  const [activeJobId, setActiveJobId] = useState<string>(() => run.jobs[0]?.jobId || "");
  const [fullJob, setFullJob] = useState<ToolJob | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [activeVisualizerTab, setActiveVisualizerTab] = useState<VisualizerTab>("output");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch full details of the currently selected job within the run
  useEffect(() => {
    if (!activeJobId) return;
    let isMounted = true;
    const fetchJobData = async () => {
      setIsLoadingJob(true);
      try {
        const data = await getToolJob(tool.id, activeJobId);
        if (isMounted) {
          setFullJob(data);
        }
      } catch (err) {
        console.error("[RunClient] Failed to load full job details:", err);
      } finally {
        if (isMounted) {
          setIsLoadingJob(false);
        }
      }
    };
    fetchJobData();
    return () => { isMounted = false; };
  }, [activeJobId, tool.id]);

  const overallState = run.jobs.some(j => getJobStatus(j) === "failed")
    ? "failed"
    : run.jobs.every(j => getJobStatus(j) === "completed")
      ? "completed"
      : run.jobs.some(j => getJobStatus(j) === "active" || getJobStatus(j) === "running")
        ? "active"
        : "queued";

  const formattedTime = (createdAtStr: string) => {
    if (!createdAtStr) return "just now";
    const date = new Date(createdAtStr);
    if (isNaN(date.getTime())) return "just now";
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "just now";
    }
  };


  const activeJobCount = fullJob ? getItemCount(fullJob) : 0;

  return (
    <div className="pb-10">
      <div className="mb-6">
        <AppCover src={null} alt={`${tool.name} run cover`} accentColor="#0ea5e9">
          <div className="pt-5 sm:pt-8 flex flex-wrap gap-3">
            <Link
              href={`/tool/${tool.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/10 shadow-xs hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-95 duration-200"
            >
              <ArrowLeft className="size-3.5" />
              Back to {tool.name}
            </Link>
            <Link
              href="/apps"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition hover:bg-white/10 shadow-xs hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-95 duration-200"
            >
              All Apps
            </Link>
          </div>

          <div className="relative z-10 flex min-h-48 flex-col justify-end py-5 pt-10 text-white sm:min-h-56 sm:py-8 sm:pt-14 lg:min-h-64 lg:py-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap select-none">
                <span className="rounded-full bg-brand/20 border border-brand/30 px-2.5 py-0.5 text-[9.5px] font-bold text-white shadow-xs uppercase tracking-wider">
                  Automation Run Detail
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9.5px] font-extrabold text-slate-400 font-mono">
                  RUN #{runId.slice(0, 12).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-lg shrink-0">
                  <Terminal className="size-6 text-white animate-pulse" />
                </div>
                <h1 className="page-hero-title text-white">Execution Console</h1>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-slate-350 max-w-2xl font-medium">
                Inspecting multi-agent job orchestration pipelines for {tool.name}. Select a sub-job step from the execution list to inspect dynamic outputs and logs.
              </p>
            </div>
          </div>
        </AppCover>
      </div>

      {/* Split Pane Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Run Pipeline Summary & Sub-Jobs list */}
        <div className={cn(
          "lg:col-span-1 space-y-4 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs transition-all duration-300 lg:sticky lg:top-24 lg:self-start lg:h-fit",
          isExpanded ? "hidden lg:hidden" : "block"
        )}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Play className="size-4 text-brand" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Run Pipeline</h3>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase select-none tracking-wider",
              STATUS_COLORS[overallState]?.bg
            )}>
              <span className={cn("size-1.5 rounded-full shrink-0", STATUS_COLORS[overallState]?.dot)} />
              <span>{overallState}</span>
            </div>
          </div>

          {/* Jobs List Step-by-Step */}
          <div className="space-y-3">
            {run.jobs.map((job, idx) => {
              const jobStatus = getJobStatus(job);
              const isSelected = activeJobId === job.jobId;
              const pluginLower = String(job.plugin || "").toLowerCase();
              const slicedJobId = job.jobId ? `#${job.jobId.split("-")[0].toUpperCase().slice(0, 8)}` : "";
              
              return (
                <button
                  key={job.id || job.jobId || idx}
                  onClick={() => setActiveJobId(job.jobId)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border relative overflow-hidden transition-all duration-300 flex items-center justify-between group cursor-pointer",
                    isSelected
                      ? "bg-slate-50 border-brand shadow-xs"
                      : "bg-white border-slate-150 hover:bg-slate-50/50 hover:border-slate-350"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand to-brand-strong" />
                  )}

                  <div className={cn("min-w-0 flex-1", isSelected && "pl-1")}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold text-slate-800 tracking-tight leading-none capitalize">
                        {pluginLower} Scraper
                      </span>
                      <span className="text-[8px] px-1 py-0.5 bg-slate-100 border border-slate-200/50 text-slate-400 font-extrabold rounded">
                        {slicedJobId}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 select-none">
                      <span className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-extrabold uppercase tracking-wider",
                        STATUS_COLORS[jobStatus]?.bg
                      )}>
                        <span className={cn("size-1 rounded-full", STATUS_COLORS[jobStatus]?.dot)} />
                        {jobStatus}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {formattedTime(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className={cn(
                    "size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 shrink-0 ml-2",
                    isSelected ? "text-brand" : "text-slate-300"
                  )} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Run Detail Workspace Area (Inline console tabs) */}
        <div className={cn(
          "bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden flex flex-col min-h-[500px] transition-all duration-300",
          isExpanded ? "lg:col-span-3" : "lg:col-span-2"
        )}>
          {isLoadingJob ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white text-slate-400 select-none">
              <Loader2 className="size-8 text-brand animate-spin" />
              <p className="text-xs font-bold text-slate-700">Loading Console workspace...</p>
              <p className="text-[10px] text-slate-450">Fetching job run datasets and memory logs...</p>
            </div>
          ) : fullJob ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Inline Header Details */}
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 capitalize">{fullJob.plugin} Engine Workspace</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase select-none">
                          #{fullJob.jobId.slice(0, 16)}
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-500 font-semibold truncate max-w-sm md:max-w-md">
                        Input: {fullJob.input?.userInput || "N/A"}
                      </p>
                    </div>

                    {/* Header Actions: Expand & Export */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Expand / Minimize Button */}
                      <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-md text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-3xs text-slate-600 hover:text-slate-800 flex items-center justify-center gap-1.5"
                        title={isExpanded ? "Show Sidebar" : "Hide Sidebar (100% Width)"}
                      >
                        {isExpanded ? (
                          <>
                            <Minimize2 className="size-3.5" />
                            <span className="hidden md:inline">Collapse</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="size-3.5" />
                            <span className="hidden md:inline">Full Width</span>
                          </>
                        )}
                      </button>

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

              {/* Visualizer Console Navigation */}
              <ConsoleNavigation 
                activeTab={activeVisualizerTab} 
                itemCount={activeJobCount} 
                onTabChange={setActiveVisualizerTab} 
              />

              {/* Visualizer Output Content Area */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
                {activeVisualizerTab === "output" && <TabOutput job={fullJob} />}
                {activeVisualizerTab === "log" && <TabLog job={fullJob} />}
                {activeVisualizerTab === "input" && <TabInputStorage job={fullJob} mode="input" />}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white text-slate-400 select-none">
              <ShieldAlert className="size-8 text-rose-500 animate-bounce" />
              <p className="text-xs font-semibold text-slate-750">Failed to render Job workspace.</p>
              <p className="text-[10px] text-slate-400">Select a sub-job from the pipeline menu to reinitialize.</p>
            </div>
          )}
        </div>
      </div>

      {fullJob && (
        <ExportDatasetModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          job={fullJob}
        />
      )}
    </div>
  );
}
