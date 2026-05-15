"use client";

import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, List, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobStatus, getItemCount, type AnalysisResult, type SourceItem } from "./tool-job-utils";

interface ToolJobModalProps {
    open: boolean;
    isLoading: boolean;
    job: ToolJob | null;
    onOpenChange: (open: boolean) => void;
}

export function ToolJobModal({ open, isLoading, job, onOpenChange }: ToolJobModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none bg-slate-50">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="size-10 text-brand animate-spin" />
                        <p className="text-sm text-slate-500 font-medium">Loading job details...</p>
                    </div>
                ) : job ? (
                    <JobDetailContent job={job} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <p className="text-sm text-slate-500">No job data available.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function JobDetailContent({ job }: { job: ToolJob }) {
    const status = getJobStatus(job);

    return (
        <>
            <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="size-5" /> Job Result Detail
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-mono text-xs">ID: {job.jobId}</DialogDescription>
                    </div>
                    <Badge variant="outline" className={cn("font-bold px-3 py-1",
                        status === 'completed' ? "bg-teal-500/20 text-teal-400 border-teal-500/30" :
                            status === 'running' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                "bg-red-500/20 text-red-400 border-red-500/30")}>
                        {status === 'completed' && <CheckCircle2 className="size-3 mr-1" />}
                        {status === 'running' && <Loader2 className="size-3 mr-1 animate-spin" />}
                        {status.toUpperCase()}
                    </Badge>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Config Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Model Configuration</span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <div className="size-2 rounded-full bg-brand" />
                            {String(job.config?.model || 'Default Model')}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Processed Time</span>
                        <div className="text-sm font-semibold text-slate-700">
                            {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {job.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-800">Job Failed</p>
                            <p className="text-xs text-red-600 leading-relaxed">
                                {typeof job.error === 'string' ? job.error : JSON.stringify(job.error)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Result Items */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <List className="size-4 text-brand" /> Processed Items ({getItemCount(job)})
                    </h3>
                    <div className="space-y-4">
                        {(job.result?.items || []).length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                                <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <List className="size-6 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-500">No result items found for this job.</p>
                            </div>
                        ) : (
                            job.result?.items.map((item, idx) => (
                                <JobResultItem key={`modal-item-${idx}`} item={item} idx={idx} job={job} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function JobResultItem({ item, idx, job }: {
    item: ToolJob['result']['items'][0];
    idx: number;
    job: ToolJob;
}) {
    const itemText = typeof item.text === 'string' ? item.text : '';
    const inputItems = (job.input?.previousResults as { items?: SourceItem[] })?.items || [];
    const sourceItem: SourceItem = inputItems.find((ii) =>
        ii.postId === item.sourceKeyValue ||
        ii.id === item.sourceKeyValue ||
        ii._id === item.sourceKeyValue ||
        ii.url === item.sourceKeyValue
    ) || {};

    const sourceText = itemText || sourceItem.text || sourceItem.message || sourceItem.caption || sourceItem.content || '';
    const analysis = (item.analysis as AnalysisResult) || {};
    const displayName = String(
        (typeof item.pageName === 'string' ? item.pageName : '') ||
        sourceItem.pageName || item.postId || item.sourceKeyValue || `Item ${idx + 1}`
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold border border-brand/20">
                        {idx + 1}
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] block">{displayName}</span>
                        <span className="text-[10px] text-slate-400">ID: {String(item.postId || item.sourceKeyValue || '—')}</span>
                    </div>
                </div>
                {sourceItem.url && (
                    <a href={sourceItem.url} target="_blank" rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-100">
                        <ExternalLink className="size-4" />
                    </a>
                )}
            </div>
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source Content</span>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        {sourceText
                            ? <p className="text-xs text-slate-600 line-clamp-6 leading-relaxed italic">&quot;{sourceText}&quot;</p>
                            : <p className="text-xs text-slate-400 italic">No source content available.</p>}
                    </div>
                </div>
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Analysis</span>
                        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            analysis.sentiment === 'positive' ? "bg-teal-100 text-teal-700" :
                                analysis.sentiment === 'negative' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700")}>
                            {analysis.sentiment || 'Neutral'}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                            <p className="text-[11px] text-slate-800 leading-relaxed font-medium">{analysis.summary || 'No summary available.'}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(analysis.keywords) && analysis.keywords.length > 0
                                ? analysis.keywords.map((kw: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-md text-[10px] font-semibold hover:border-brand/30 hover:text-brand transition-colors">#{kw}</span>
                                ))
                                : <span className="text-[10px] text-slate-400 italic">No keywords</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
