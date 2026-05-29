import type { ToolJob } from "@/core/interfaces/tools.interface";

export interface PreviousResultsItem {
    facebookUrl?: string;
    permalink_url?: string;
    url?: string;
    [key: string]: unknown;
}

export interface PreviousResults {
    resultId?: string;
    actorId?: string;
    runId?: string;
    itemCount?: number;
    items?: PreviousResultsItem[];
}

export interface StartUrlItem {
    url?: string;
    [key: string]: unknown;
}

export interface ExtendedToolJobResult {
    itemCount: number;
    items: Array<{
        sourceIndex: number;
        sourceKey: string;
        sourceKeyValue: string;
        analysis: Record<string, unknown>;
        [key: string]: unknown;
    }>;
    config?: Record<string, unknown> | string;
    prompt?: string;
    actorId?: string;
}

export interface ExtendedToolJob extends Omit<ToolJob, 'result'> {
    result: ExtendedToolJobResult;
    model?: string;
    itemKey?: string;
    prompt?: string;
    actorId?: string;
}

export type JobStatus = string;

export interface AnalysisResult {
    sentiment?: string;
    summary?: string;
    keywords?: string[];
    intentRatios?: {
        buyIntent: number;
        notInterested: number;
        negative: number;
    };
    postType?: string;
    multiLabels?: string[];
    politicians?: string[];
    commentThemes?: Array<{
        theme: string;
        count: number;
        percentage: number;
    }>;
    // Consumer-intent analysis (purchase intent job)
    postUrl?: string;
    groups?: Array<{
        label: string;
        count: number;
        percentage: number;
    }>;
    verdict?: string;
    conversionLeader?: boolean;
}

export interface ScrapedComment {
    authorName?: string;
    text: string;
    mentions?: string[];
}

export interface ScrapedJobItem {
    url?: string;
    facebookUrl?: string;
    postId?: string;
    pageName?: string;
    text?: string;
    likes?: number;
    shares?: number;
    viewsCount?: number;
    commentsCount?: number;
    reactionLikeCount?: number;
    reactionLoveCount?: number;
    reactionCareCount?: number;
    reactionHahaCount?: number;
    reactionWowCount?: number;
    reactionSadCount?: number;
    reactionAngryCount?: number;
    user?: {
        profilePic?: string;
        name?: string;
    };
    media?: Array<{
        thumbnail?: string;
    }>;
    comments?: ScrapedComment[];
    analysis?: AnalysisResult;
    sourceKeyValue?: string;
    time?: string;
    timestamp?: number;
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
    if (job.status) {
        const normalized = job.status.toLowerCase();
        if (normalized === 'running') return 'active';
        return normalized;
    }
    if (job.error) return 'failed';
    if (job.state) {
        const normalized = job.state.toLowerCase();
        if (normalized === 'running') return 'active';
        return normalized;
    }
    if (job.processed) return 'completed';
    return 'active';
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

export const getMergedGeminiItems = (job: ToolJob): ScrapedJobItem[] => {
    const pluginLower = String(job.plugin || "").toLowerCase();
    
    // If it's not a Gemini job, just return result.items or empty list
    if (pluginLower !== "gemini") {
        return (job.result?.items || []) as ScrapedJobItem[];
    }

    const previousItems = (job.input?.previousResults as { items?: SourceItem[] } | undefined)?.items || [];
    const geminiItems = job.result?.items || [];
    const wrapResult = (job.config as Record<string, unknown> | undefined)?.wrapResult === true;

    // If no gemini result yet but we have previous scraper items, display them as-is (no analysis)
    if (geminiItems.length === 0 && previousItems.length > 0) {
        return previousItems.map((prevItem, idx) => ({
            ...prevItem,
            sourceIndex: idx,
            sourceKey: "postId",
            analysis: undefined,
            sourceKeyValue: prevItem.postId || prevItem.id || prevItem._id,
        } as unknown as ScrapedJobItem));
    }

    // Map each previous scraper item to a merged item with Gemini analysis
    return previousItems.map((prevItem, idx) => {
        const matchedGemini = geminiItems.find((g) => {
            const sourceVal = String(g.sourceKeyValue || "");
            const indexMatch = typeof g.sourceIndex === "number" && g.sourceIndex === idx;
            const idMatch = sourceVal && (
                String(prevItem.postId || "") === sourceVal ||
                String(prevItem.id || "") === sourceVal ||
                String(prevItem._id || "") === sourceVal ||
                String(prevItem.url || "") === sourceVal
            );
            return indexMatch || idMatch;
        });

        // Build analysis: wrapResult=true stores fields at top-level of result item, not under .analysis
        let analysis: AnalysisResult | undefined = matchedGemini?.analysis as AnalysisResult | undefined;
        if (!analysis && matchedGemini && wrapResult) {
            const g = matchedGemini as Record<string, unknown>;
            // Collect any recognizable analysis fields from the top-level result item
            const hasFlatAnalysis = g.sentiment || g.summary || g.keywords || g.groups || g.verdict;
            if (hasFlatAnalysis) {
                analysis = {
                    sentiment: g.sentiment as string | undefined,
                    summary: g.summary as string | undefined,
                    keywords: g.keywords as string[] | undefined,
                    groups: g.groups as AnalysisResult["groups"],
                    verdict: g.verdict as string | undefined,
                    conversionLeader: g.conversionLeader as boolean | undefined,
                };
            }
        }

        return {
            ...prevItem,
            sourceIndex: idx,
            sourceKey: matchedGemini?.sourceKey || "postId",
            analysis,
            sourceKeyValue: matchedGemini?.sourceKeyValue || prevItem.postId || prevItem.id || prevItem._id,
        } as unknown as ScrapedJobItem;
    });
};
