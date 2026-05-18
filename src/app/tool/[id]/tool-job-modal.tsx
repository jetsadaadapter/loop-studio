"use client";

import { useState } from "react";
import Image from "next/image";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, List, AlertCircle, CheckCircle2, ExternalLink, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobStatus, getItemCount, type AnalysisResult, type SourceItem, type ScrapedComment, type ScrapedJobItem } from "./tool-job-utils";
import { RatioVisualizer, MultiLabelVisualizer, AccordionVisualizer } from "./visualizer-strategies";

interface ToolJobModalProps {
    open: boolean;
    isLoading: boolean;
    job: ToolJob | null;
    onOpenChange: (open: boolean) => void;
}

export function ToolJobModal({ open, isLoading, job, onOpenChange }: ToolJobModalProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                side="right" 
                className="!w-full sm:!max-w-[550px] md:!max-w-[700px] lg:!max-w-[900px] xl:!max-w-[1100px] overflow-hidden flex flex-col p-0 border-none bg-slate-50 shadow-2xl transition-all duration-300 h-full"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 className="size-10 text-brand animate-spin" />
                        <p className="text-sm text-slate-500 font-medium">Loading job details...</p>
                    </div>
                ) : job ? (
                    <JobDetailContent job={job} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <p className="text-sm text-slate-500">No job data available.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function JobDetailContent({ job }: { job: ToolJob }) {
    const status = getJobStatus(job);
    const [viewMode, setViewMode] = useState<'flat' | 'group'>('flat');

    // Scan for unique politicians
    const allPoliticiansSet = new Set<string>();
    const items = job.result?.items || [];
    items.forEach(item => {
        const analysis = (item.analysis as AnalysisResult) || {};
        if (Array.isArray(analysis.politicians)) {
            analysis.politicians.forEach(p => allPoliticiansSet.add(p));
        }
    });
    const uniquePoliticians = Array.from(allPoliticiansSet);
    const hasPoliticians = uniquePoliticians.length > 0;

    return (
        <>
            <SheetHeader className="p-6 bg-white border-b border-slate-200 shrink-0 relative pr-12">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                            <FileText className="size-5 text-brand" /> Job Result Detail
                        </SheetTitle>
                        <SheetDescription className="text-slate-400 font-mono text-[10px]">ID: {job.jobId}</SheetDescription>
                    </div>
                    <Badge variant="outline" className={cn("font-bold px-3 py-1 text-xs shadow-sm border",
                        status === 'completed' ? "bg-teal-50/80 text-teal-700 border-teal-200" :
                            status === 'running' ? "bg-amber-50/80 text-amber-700 border-amber-200" :
                                "bg-rose-50/80 text-rose-700 border-rose-200")}>
                        {status === 'completed' && <CheckCircle2 className="size-3 mr-1" />}
                        {status === 'running' && <Loader2 className="size-3 mr-1 animate-spin" />}
                        {status.toUpperCase()}
                    </Badge>
                </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
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
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <List className="size-4 text-brand" /> Processed Items ({getItemCount(job)})
                        </h3>
                        {hasPoliticians && (
                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => setViewMode('flat')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
                                        viewMode === 'flat' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                                >
                                    <List className="size-3.5" /> Flat List
                                </button>
                                <button
                                    onClick={() => setViewMode('group')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
                                        viewMode === 'group' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                                >
                                    <Users className="size-3.5" /> Group By Politician
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                                <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <List className="size-6 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-500">No result items found for this job.</p>
                            </div>
                        ) : viewMode === 'group' ? (
                            uniquePoliticians.map((politician, index) => {
                                const politicianComments: Array<{
                                    authorName?: string;
                                    text: string;
                                    postUrl?: string;
                                    postPage?: string;
                                    profilePic?: string;
                                }> = [];

                                items.forEach(item => {
                                    const typedItem = item as unknown as ScrapedJobItem;
                                    const comments = Array.isArray(typedItem.comments) ? typedItem.comments : [];
                                    const pageProfilePic = typedItem.user?.profilePic || "";
                                    comments.forEach((comment: ScrapedComment) => {
                                        if (comment.mentions?.some((m: string) => m.toLowerCase().includes(politician.toLowerCase()))) {
                                            politicianComments.push({
                                                authorName: comment.authorName,
                                                text: comment.text,
                                                postUrl: String(typedItem.url || typedItem.facebookUrl || ""),
                                                postPage: String(typedItem.pageName || typedItem.postId || ""),
                                                profilePic: pageProfilePic
                                            });
                                        }
                                    });
                                });

                                return (
                                    <div key={`${politician}-${index}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                                                    <User className="size-4 animate-pulse" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-slate-800">{politician}</span>
                                                    <span className="text-[10px] text-slate-400 block font-semibold">{politicianComments.length} mentions across all scraped links</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto bg-slate-50/30">
                                            {politicianComments.length > 0 ? (
                                                politicianComments.map((comment, commentIdx) => (
                                                    <div key={commentIdx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2.5 transition-all hover:scale-[1.005]">
                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                {comment.profilePic ? (
                                                                    <Image 
                                                                        src={comment.profilePic} 
                                                                        width={20} 
                                                                        height={20} 
                                                                        unoptimized 
                                                                        className="size-5 rounded-full object-cover border border-slate-200" 
                                                                        alt={comment.postPage || "Profile pic"} 
                                                                    />
                                                                ) : (
                                                                    <div className="size-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                                                                        {comment.postPage?.charAt(0) || 'P'}
                                                                    </div>
                                                                )}
                                                                <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{comment.postPage}</span>
                                                            </div>
                                                            <span className="font-bold text-brand text-[10px]">👤 {comment.authorName || "Anonymous User"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-slate-600 leading-relaxed italic font-medium">&quot;{comment.text}&quot;</p>
                                                            {comment.postUrl && (
                                                                <a href={comment.postUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-slate-400 hover:text-brand flex items-center gap-1 transition-colors shrink-0 ml-4">
                                                                    View Post <ExternalLink className="size-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic text-center py-4">No comments found matching this politician.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            items.map((item, idx) => (
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

    const typedItem = item as unknown as ScrapedJobItem;
    const typedSource = sourceItem as unknown as ScrapedJobItem;

    const sourceText = itemText || sourceItem.text || sourceItem.message || sourceItem.caption || sourceItem.content || '';
    const analysis = (item.analysis as AnalysisResult) || {};

    // Audited fields from raw scraper JSON
    const profilePic = String(typedItem.user?.profilePic || typedSource.user?.profilePic || '');
    const likes = typeof typedItem.likes === 'number' ? typedItem.likes : typeof typedSource.likes === 'number' ? typedSource.likes : undefined;
    const shares = typeof typedItem.shares === 'number' ? typedItem.shares : typeof typedSource.shares === 'number' ? typedSource.shares : undefined;
    const viewsCount = typeof typedItem.viewsCount === 'number' ? typedItem.viewsCount : typeof typedSource.viewsCount === 'number' ? typedSource.viewsCount : undefined;
    const commentsCount = typeof typedItem.commentsCount === 'number' 
        ? typedItem.commentsCount 
        : typeof typedItem.comments === 'number'
            ? typedItem.comments
            : Array.isArray(typedItem.comments) 
                ? typedItem.comments.length 
                : typeof typedSource.commentsCount === 'number' 
                    ? typedSource.commentsCount 
                    : typeof typedSource.comments === 'number'
                        ? typedSource.comments
                        : undefined;
    const thumbnail = String(typedItem.media?.[0]?.thumbnail || typedSource.media?.[0]?.thumbnail || '');

    const displayName = String(
        (typeof item.pageName === 'string' ? item.pageName : '') ||
        sourceItem.pageName || item.postId || item.sourceKeyValue || `Item ${idx + 1}`
    );

    const postUrl = String(item.url || item.facebookUrl || sourceItem.url || '');

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {profilePic ? (
                        <Image
                            src={profilePic}
                            alt={displayName}
                            width={32}
                            height={32}
                            unoptimized
                            className="size-8 rounded-full border border-slate-200 object-cover shadow-sm"
                            onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold border border-brand/20">
                            {idx + 1}
                        </div>
                    )}
                    <div>
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] block">{displayName}</span>
                        <span className="text-[10px] text-slate-400">ID: {String(item.postId || item.sourceKeyValue || '—')}</span>
                    </div>
                </div>
                {postUrl && (
                    <a href={postUrl} target="_blank" rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-100 shadow-sm bg-slate-50">
                        <ExternalLink className="size-4" />
                    </a>
                )}
            </div>
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Side: Source Post Preview */}
                <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center h-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Content</span>
                    </div>

                    {/* Render Image Thumbnail if scraped */}
                    {thumbnail && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-100 shadow-sm h-[160px] bg-slate-50 w-full">
                            <Image
                                src={thumbnail}
                                alt="Post thumbnail"
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-cover"
                                onError={(e) => {
                                    (e.target as HTMLElement).parentElement!.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        {sourceText
                            ? <p className="text-xs text-slate-600 line-clamp-6 leading-relaxed italic font-medium">&quot;{sourceText}&quot;</p>
                            : <p className="text-xs text-slate-400 italic">No source content available.</p>}
                    </div>

                    {/* Social Metrics Bar */}
                    {(likes !== undefined || shares !== undefined || viewsCount !== undefined || commentsCount !== undefined) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[10px] text-slate-500 font-bold">
                            {viewsCount !== undefined && (
                                <span className="flex items-center gap-1 bg-slate-50 text-slate-600 py-1 px-2.5 rounded-full border border-slate-200 shadow-sm transition-all hover:bg-slate-100 cursor-default">
                                    👁️ {viewsCount.toLocaleString()} Views
                                </span>
                            )}
                            {likes !== undefined && (
                                <span className="flex items-center gap-1 bg-slate-50 text-slate-600 py-1 px-2.5 rounded-full border border-slate-200 shadow-sm transition-all hover:bg-slate-100 cursor-default">
                                    ❤️ {likes.toLocaleString()} Likes
                                </span>
                            )}
                            {commentsCount !== undefined && (
                                <span className="flex items-center gap-1 bg-slate-50 text-slate-600 py-1 px-2.5 rounded-full border border-slate-200 shadow-sm transition-all hover:bg-slate-100 cursor-default">
                                    💬 {commentsCount.toLocaleString()} Comments
                                </span>
                            )}
                            {shares !== undefined && (
                                <span className="flex items-center gap-1 bg-slate-50 text-slate-600 py-1 px-2.5 rounded-full border border-slate-200 shadow-sm transition-all hover:bg-slate-100 cursor-default">
                                    🔁 {shares.toLocaleString()} Shares
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Dynamic AI Analysis */}
                <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between h-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Analysis</span>
                        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border shadow-sm",
                            analysis.sentiment === 'positive' ? "bg-teal-50 text-teal-700 border-teal-100" :
                                analysis.sentiment === 'negative' ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-slate-50 text-slate-700 border-slate-200")}>
                            {analysis.sentiment || 'Neutral'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Summary Widget */}
                        <div className="bg-brand/5 border border-brand/10 p-3.5 rounded-xl">
                            <p className="text-xs text-slate-800 leading-relaxed font-semibold">{analysis.summary || 'No summary available.'}</p>
                        </div>

                        {/* Keywords Hashdeck */}
                        <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(analysis.keywords) && analysis.keywords.length > 0
                                ? analysis.keywords.map((kw: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-500 rounded-md text-[10px] font-bold hover:border-brand/30 hover:text-brand transition-colors cursor-default shadow-sm">#{kw}</span>
                                ))
                                : <span className="text-[10px] text-slate-400 italic">No keywords</span>}
                        </div>

                        {/* ============================================================== */}
                        {/* 🚀 DYNAMIC ADAPTIVE VISUALIZER STRATEGIES                       */}
                        {/* ============================================================== */}
                        {analysis.intentRatios && (
                            <div className="pt-4 border-t border-slate-100">
                                <RatioVisualizer intentRatios={analysis.intentRatios} />
                            </div>
                        )}

                        {analysis.postType && (
                            <div className="pt-4 border-t border-slate-100">
                                <MultiLabelVisualizer postType={analysis.postType} commentThemes={analysis.commentThemes} />
                            </div>
                        )}

                        {analysis.politicians && (
                            <div className="pt-4 border-t border-slate-100">
                                <AccordionVisualizer politicians={analysis.politicians} comments={Array.isArray(typedItem.comments) ? typedItem.comments : []} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
