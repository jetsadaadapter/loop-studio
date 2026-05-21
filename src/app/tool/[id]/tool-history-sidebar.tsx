"use client";

import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ChevronRight, Clock, RefreshCw, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getJobStatus, getItemCount, type JobStatus } from "./tool-job-utils";

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

export function ToolHistorySidebar({ jobs, activeTab, selectedJobId, isRefreshing, onTabChange, onViewJob, onViewVisualizer, onRefresh }: ToolHistorySidebarProps) {
    const tabs = ['all', ...Array.from(new Set(jobs.map(j => getJobStatus(j))))];
    const filtered = jobs.filter(job => activeTab === 'all' || getJobStatus(job) === activeTab);

    return (
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-slate-200/60 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-100/60 p-4 md:p-5 pb-4 md:pb-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 border border-indigo-100/80 text-brand rounded-xl shrink-0 shadow-xs">
                            <History className="size-4 text-brand" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                                Job History
                            </CardTitle>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">Automation history & execution logs</span>
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
                {/* Filter group from actual job states */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button key={tab} onClick={() => onTabChange(tab)}
                                className={cn("px-3 py-1.5 text-[9.5px] font-extrabold uppercase tracking-wider rounded-full border transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs",
                                    isActive
                                        ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                                        : "bg-white border-slate-200/80 text-slate-500 hover:border-slate-350 hover:bg-slate-50")}>
                                {tab === 'completed' && (
                                    <span className={cn("size-1.5 rounded-full shrink-0", isActive ? "bg-emerald-400 animate-pulse" : "bg-emerald-500")} />
                                )}
                                {tab === 'running' && (
                                    <span className={cn("size-1.5 rounded-full shrink-0 animate-pulse bg-amber-550")} />
                                )}
                                {tab === 'failed' && (
                                    <span className={cn("size-1.5 rounded-full shrink-0", isActive ? "bg-rose-400 animate-pulse" : "bg-rose-500")} />
                                )}
                                {tab === 'all' && (
                                    <span className={cn("size-1.5 rounded-full shrink-0 bg-indigo-500", isActive && "bg-indigo-400 animate-pulse")} />
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
                            <Clock className="size-8 text-slate-350 mx-auto animate-pulse relative z-10 shrink-0" />
                            <p className="text-xs text-slate-450 font-bold relative z-10">No {activeTab !== 'all' ? activeTab : ''} jobs found.</p>
                            <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mx-auto relative z-10 leading-normal">Configure parameter options on the left to start a new execution job.</p>
                        </div>
                    ) : (
                        <div className="p-3 md:p-4 space-y-3 max-h-[600px] overflow-y-auto bg-slate-50/20">
                            {filtered.map(job => {
                                const status = getJobStatus(job);
                                const isSelected = selectedJobId === job.jobId;
                                
                                // Dynamic human-friendly title based on the provider/plugin
                                const pluginLower = String(job.plugin || '').toLowerCase();
                                const friendlyTitle = pluginLower === 'apify' ? "Apify Post Scraper" :
                                                      pluginLower === 'gemini' ? "Gemini AI Analysis" :
                                                      "Automation Run";
                                
                                // Slice the UUID to show a beautiful technical hash tag
                                const slicedId = `#${job.jobId.split('-')[0] || ''}`;

                                return (
                                    <div key={job.jobId} onClick={() => onViewJob(job.jobId)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                onViewJob(job.jobId);
                                            }
                                        }}
                                        className={cn(
                                            "w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between group cursor-pointer relative overflow-hidden select-none outline-none",
                                            isSelected 
                                                ? "bg-white border-brand shadow-[0_4px_16px_rgba(194,0,25,0.06)]" 
                                                : "bg-white border-slate-200/80 hover:border-slate-350 hover:bg-slate-50/50 hover:shadow-xs hover:-translate-y-0.5"
                                        )}
                                    >
                                        {/* Left-edge brand highlight strip for selected states */}
                                        {isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand to-brand-strong" />
                                        )}
                                        
                                        <div className={cn("min-w-0 w-full", isSelected && "pl-2")}>
                                            <div className="flex items-center gap-2 w-full justify-between">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-800 tracking-tight truncate leading-none">
                                                        {friendlyTitle}
                                                    </h4>
                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-extrabold tracking-wider rounded-md select-none shrink-0 border border-slate-200/40 uppercase">
                                                        {slicedId}
                                                    </span>
                                                </div>
                                                <span className="text-[9.5px] text-slate-400 font-semibold shrink-0">
                                                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mt-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn(
                                                        "size-1.5 rounded-full shrink-0",
                                                        status === 'completed' ? "bg-emerald-500 animate-pulse" :
                                                        status === 'running' ? "bg-amber-500 animate-pulse" :
                                                        status === 'failed' ? "bg-rose-500 animate-pulse" : "bg-slate-400 animate-pulse"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[9.5px] font-extrabold uppercase select-none tracking-wider",
                                                        status === 'completed' ? "text-emerald-600" :
                                                        status === 'running' ? "text-amber-600" :
                                                        status === 'failed' ? "text-rose-600" : "text-slate-500"
                                                    )}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[10px] text-slate-550 font-bold">
                                                    {getItemCount(job)} items processed
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="pl-2 shrink-0 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewVisualizer(job.jobId);
                                                }}
                                                title="Open Apify Workspace Console"
                                                className="p-1.5 rounded-lg border border-slate-200/80 text-slate-450 hover:text-brand hover:bg-brand/5 hover:border-brand/20 transition-all cursor-pointer bg-slate-50 opacity-0 group-hover:opacity-100 focus:opacity-100 select-none shadow-xs active:scale-95 flex items-center justify-center"
                                            >
                                                <Terminal className="size-3.5" />
                                            </button>

                                            <ChevronRight className={cn(
                                                "size-4 transition-all duration-300 group-hover:translate-x-0.5",
                                                isSelected ? "text-brand" : "text-slate-300 group-hover:text-slate-450"
                                            )} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
