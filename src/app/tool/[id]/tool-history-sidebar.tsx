"use client";

import { useState } from "react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobStatus, type JobStatus } from "./tool-job-utils";
import { HistoryJobItem } from "./components/history/history-job-item";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ToolHistorySidebarProps {
  jobs: ToolJob[];
  activeTab: JobStatus;
  selectedJobId?: string;
  isRefreshing?: boolean;
  onTabChange: (tab: JobStatus) => void;
  onViewJob: (jobId: string) => void;
  onViewVisualizer: (jobId: string) => void;
  onRefresh: () => void;
}

export function ToolHistorySidebar({
  jobs,
  activeTab,
  selectedJobId,
  isRefreshing,
  onTabChange,
  onViewJob,
  onRefresh,
}: ToolHistorySidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = ["all", ...Array.from(new Set(jobs.map((j) => getJobStatus(j))))];
  const filtered = jobs.filter(
    (job) => activeTab === "all" || getJobStatus(job) === activeTab
  );

  const handleSelectJob = (jobId: string, isMobile: boolean) => {
    onViewJob(jobId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Sidebar Layout (Stacked on mobile, side-by-side on desktop) */}
      <div className="block">
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-slate-200/60 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-100/60 p-5 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 border border-indigo-100/80 text-brand rounded-xl shrink-0 shadow-xs">
                  <History className="size-4 text-brand" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                    Job History
                  </CardTitle>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                    Automation history & execution logs
                  </span>
                </div>
              </div>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh job history"
                className="p-2 rounded-xl border border-slate-200/80 text-slate-450 hover:text-brand hover:bg-brand/5 hover:border-brand/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white shadow-xs"
              >
                <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={cn(
                      "px-3 py-1.5 text-[9.5px] font-extrabold uppercase tracking-wider rounded-full border transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs",
                      isActive
                        ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                        : "bg-white border-slate-200/80 text-slate-500 hover:border-slate-350 hover:bg-slate-50"
                    )}
                  >
                    {tab === "completed" && (
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          isActive ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"
                        )}
                      />
                    )}
                    {tab === "running" && (
                      <span className="size-1.5 rounded-full shrink-0 animate-pulse bg-amber-550" />
                    )}
                    {tab === "failed" && (
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          isActive ? "bg-rose-400 animate-pulse" : "bg-rose-500"
                        )}
                      />
                    )}
                    {tab === "all" && (
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0 bg-indigo-500",
                          isActive && "bg-indigo-400 animate-pulse"
                        )}
                      />
                    )}
                    <span>{tab}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-14 text-center space-y-3 px-4 relative overflow-hidden select-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-slate-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
                  <Clock className="size-8 text-slate-355 mx-auto animate-pulse relative z-10 shrink-0" />
                  <p className="text-xs text-slate-450 font-bold relative z-10">
                    No {activeTab !== "all" ? activeTab : ""} jobs found.
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mx-auto relative z-10 leading-normal">
                    Configure parameter options on the left to start a new execution job.
                  </p>
                </div>
              ) : (
                <div className="p-3 md:p-4 space-y-3 max-h-[600px] overflow-y-auto bg-slate-50/20">
                  {filtered.map((job) => (
                    <HistoryJobItem
                      key={job.jobId}
                      job={job}
                      isSelected={selectedJobId === job.jobId}
                      onSelect={(id) => handleSelectJob(id, false)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button for Mobile / Tablet Viewports */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="relative size-14 rounded-full bg-brand text-white flex items-center justify-center cursor-pointer shadow-[0_4px_24px_rgba(194,0,25,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 border border-brand-strong/20"
        >
          <History className="size-6" />
          {jobs.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-slate-900 border border-white/20 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-1.5 shadow-sm">
              {jobs.length}
            </span>
          )}
        </button>
      </div>

      {/* Responsive Sheet Content */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col h-full bg-slate-50 border-l border-slate-200"
        >
          <SheetHeader className="bg-white border-b border-slate-100 p-5 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 border border-indigo-100/80 text-brand rounded-xl shrink-0">
                <History className="size-4 text-brand" />
              </div>
              <div className="text-left">
                <SheetTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                  Job History
                </SheetTitle>
                <SheetDescription className="text-[10px] text-slate-400 font-medium mt-1">
                  Automation history & execution logs
                </SheetDescription>
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="mr-8 p-2 rounded-xl border border-slate-200 text-slate-505 hover:text-brand hover:bg-brand/5 hover:border-brand/20 transition-all disabled:opacity-40 cursor-pointer bg-white"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            </button>
          </SheetHeader>

          {/* Sticky filter tabs inside the drawer */}
          <div className="bg-white px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={cn(
                      "px-3 py-1.5 text-[9.5px] font-extrabold uppercase tracking-wider rounded-full border transition-all duration-300 flex items-center gap-1.5 cursor-pointer",
                      isActive
                        ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                        : "bg-white border-slate-200/80 text-slate-550 hover:bg-slate-50"
                    )}
                  >
                    {tab === "completed" && (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                    {tab === "running" && (
                      <span className="size-1.5 rounded-full bg-amber-550 animate-pulse" />
                    )}
                    {tab === "failed" && (
                      <span className="size-1.5 rounded-full bg-rose-500" />
                    )}
                    {tab === "all" && (
                      <span className="size-1.5 rounded-full bg-indigo-500" />
                    )}
                    <span>{tab}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable list container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="py-20 text-center space-y-3 px-4 relative overflow-hidden select-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-slate-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
                <Clock className="size-8 text-slate-300 mx-auto animate-pulse relative z-10" />
                <p className="text-xs text-slate-500 font-bold relative z-10">
                  No {activeTab !== "all" ? activeTab : ""} jobs found.
                </p>
                <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mx-auto relative z-10 leading-normal">
                  Configure parameters on the left to start a new execution job.
                </p>
              </div>
            ) : (
              filtered.map((job) => (
                <HistoryJobItem
                  key={job.jobId}
                  job={job}
                  isSelected={selectedJobId === job.jobId}
                  isMobile
                  onSelect={(id) => handleSelectJob(id, true)}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
