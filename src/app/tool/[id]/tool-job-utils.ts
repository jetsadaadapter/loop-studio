import type { ToolJob } from "@/core/interfaces/tools.interface";

export type JobStatus = string;

export interface AnalysisResult {
    sentiment?: string;
    summary?: string;
    keywords?: string[];
}

export interface SourceItem {
    postId?: string;
    id?: string;
    _id?: string;
    pageName?: string;
    url?: string;
    text?: string;
    message?: string;
    caption?: string;
    content?: string;
    [key: string]: unknown;
}

export const getJobStatus = (job: ToolJob): JobStatus => {
    if (job.status) return job.status;
    if (job.error) return 'failed';
    if (job.state) return job.state.toLowerCase();
    if (job.processed) return 'completed';
    return 'running';
};

export const getItemCount = (job: ToolJob): number => {
    if (job.result?.itemCount && job.result.itemCount > 0) return job.result.itemCount;
    if (Array.isArray(job.result?.items) && job.result.items.length > 0) return job.result.items.length;

    const input = job.input || {};
    if (Array.isArray(input.startUrls)) return input.startUrls.length;
    if (Array.isArray(input.items)) return input.items.length;

    const prevResults = input.previousResults as { itemCount?: number; items?: unknown[] } | undefined;
    if (prevResults) {
        if (typeof prevResults.itemCount === 'number' && prevResults.itemCount > 0) return prevResults.itemCount;
        if (Array.isArray(prevResults.items)) return prevResults.items.length;
    }

    return 0;
};
