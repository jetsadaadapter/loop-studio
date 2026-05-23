"use client";

import { useState } from "react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertCircle, Copy, Check, Workflow, Terminal, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobStatus, getItemCount, getMergedGeminiItems } from "./tool-job-utils";
import { JobDetailSkeleton } from "./components/job-detail-skeleton";
import { JobResultItem } from "./components/job-result-item";

interface ToolJobModalProps {
    open: boolean;
    isLoading: boolean;
    job: ToolJob | null;
    onOpenChange: (open: boolean) => void;
    onOpenVisualizer?: (jobId: string) => void;
}

export function ToolJobModal({ open, isLoading, job, onOpenChange, onOpenVisualizer }: ToolJobModalProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="!w-full sm:!max-w-[480px] md:!max-w-[580px] lg:!max-w-[680px] xl:!max-w-[720px] overflow-hidden flex flex-col p-0 border-none bg-slate-50 shadow-2xl transition-all duration-300 h-full"
            >
                {isLoading ? (
                    <JobDetailSkeleton />
                ) : job ? (
                    <JobDetailContent job={job} onOpenVisualizer={onOpenVisualizer} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <p className="text-sm text-slate-500">No job data available.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function JobDetailContent({ job, onOpenVisualizer }: { job: ToolJob; onOpenVisualizer?: (jobId: string) => void }) {
    const status = getJobStatus(job);
    const [copiedJobId, setCopiedJobId] = useState(false);

    // Resolve plugin name safely
    const configPlugin = job.plugin ? job.plugin.charAt(0).toUpperCase() + job.plugin.slice(1) : '';
    
    const items = getMergedGeminiItems(job) as unknown as ToolJob["result"]["items"];

    return (
        <>
            <SheetHeader className="p-4 md:p-5 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-200 shrink-0 relative pr-16">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-brand/5 border border-brand/10 text-brand rounded-xl shrink-0 shadow-xs">
                        <Workflow className="size-4 animate-spin-slow" />
                    </div>
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <SheetTitle className="text-sm font-bold text-slate-800 tracking-tight leading-none">
                                Job Result Detail
                            </SheetTitle>

                            {/* Glowing & Saturated Apple-Level Status Indicators (standard.md Section 7) */}
                            <div className={cn(
                                "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold transition-all duration-300 select-none shrink-0 text-white border shadow-sm",
                                status === 'completed' ? "bg-emerald-500 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]" :
                                    status === 'running' ? "bg-amber-500 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]" :
                                        "bg-rose-500 border-rose-400/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                            )}>
                                <span className={cn(
                                    "size-1 rounded-full bg-white shrink-0",
                                    status === 'running' && "animate-pulse"
                                )} />
                                {status.toUpperCase()}
                            </div>
                        </div>
                        <SheetDescription className="text-slate-400 text-[10px] truncate block leading-normal font-semibold">
                            System Engine Analysis & Audit Trail Logs
                        </SheetDescription>
                    </div>
                </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6">
                {/* Visualizer Workspace Shortcut (Primary Call-to-Action) */}
                {onOpenVisualizer && (
                    <button
                        type="button"
                        onClick={() => onOpenVisualizer(job.jobId || job._id)}
                        className="w-full flex items-center justify-between p-3.5 px-4 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 hover:from-blue-600/10 hover:to-purple-600/10 border border-blue-200/40 hover:border-blue-300/60 rounded-2xl transition-all duration-300 text-left group shadow-xs cursor-pointer select-none hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-600/10 text-blue-650 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                                <Terminal className="size-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-800 block">Open Actor Workspace Console</span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal font-semibold">
                                    View full datasets, table columns, all fields, JSON, and simulated raw runner logs.
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-blue-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                )}

                {/* Compact Technical Metadata Ribbon */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-3 px-4 flex items-center justify-between text-[11px] font-medium text-slate-600 shadow-xs hover:border-slate-300 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 border-r border-slate-200/60 pr-4">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Plugin</span>
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                                <div className="size-1.5 rounded-full bg-brand animate-pulse" />
                                {configPlugin || 'N/A'}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Processed Time</span>
                            <span className="font-bold text-slate-800">
                                {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Job ID</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(job.jobId || job._id || "");
                                setCopiedJobId(true);
                                setTimeout(() => setCopiedJobId(false), 2000);
                            }}
                            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-700 font-semibold px-2 py-0.5 rounded-md shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                            title="Copy Job ID"
                        >
                            <span className="truncate max-w-[80px]">#{(job.jobId || job._id || "").slice(0, 8)}</span>
                            {copiedJobId ? (
                                <Check className="size-2.5 text-emerald-500" />
                            ) : (
                                <Copy className="size-2.5 text-slate-400" />
                            )}
                        </button>
                    </div>
                </div>

                {job.error && (
                    <div className="bg-red-50/50 border border-red-200/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-800">Job Failed</p>
                            <p className="text-xs text-red-600 leading-relaxed font-semibold">
                                {typeof job.error === 'string' ? job.error : JSON.stringify(job.error)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Workflow className="size-4 text-brand animate-pulse" /> Processed Items ({getItemCount(job)})
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-10 text-center flex flex-col items-center justify-center space-y-4 shadow-xs relative overflow-hidden group hover:border-slate-350 transition-all duration-300">
                                <div className="bg-gradient-to-tr from-slate-50 to-white size-12 rounded-2xl border border-slate-200/50 flex items-center justify-center shadow-md animate-bounce-slow text-slate-400 group-hover:scale-105 transition-transform duration-300">
                                    <Workflow className="size-5 text-brand" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold text-slate-800 tracking-tight">No Processed Items Found</h4>
                                    <p className="text-[10px] text-slate-400 leading-normal font-semibold max-w-[280px] mx-auto">
                                        This job hasn&apos;t generated any results yet. If the job is still running, check back in a few moments, or check the full workspace console.
                                    </p>
                                </div>
                                {onOpenVisualizer && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenVisualizer(job.jobId || job._id)}
                                        className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 text-slate-700 hover:text-slate-800 text-[10px] font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 cursor-pointer"
                                    >
                                        <span>Open Console</span>
                                        <ChevronRight className="size-3 text-slate-400" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Slice to first 3 items for quick preview, keeping it lightweight */}
                                {items.slice(0, 3).map((item, idx) => (
                                    <JobResultItem key={`modal-item-${idx}`} item={item} idx={idx} job={job} />
                                ))}

                                {items.length > 3 && (
                                    <div className="text-center pt-2 space-y-3">
                                        <p className="text-xs text-slate-500 font-bold tracking-wide">
                                            Viewing 3 of {items.length} items. Open the console to view all items.
                                        </p>
                                        {onOpenVisualizer && (
                                            <button
                                                type="button"
                                                onClick={() => onOpenVisualizer(job.jobId || job._id)}
                                                className="w-full flex items-center justify-center p-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 border border-slate-200/60 rounded-2xl font-extrabold text-xs transition-all hover:-translate-y-0.5 hover:shadow-xs active:scale-95 cursor-pointer select-none gap-2 shadow-xs"
                                            >
                                                <span>View All {items.length} Items in Workspace Console</span>
                                                <ChevronRight className="size-4 text-slate-500" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
