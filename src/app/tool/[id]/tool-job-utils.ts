import type { ToolJob, ToolRunGrouped } from "@/core/interfaces/tools.interface";

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
    classification?: string;
    confidence_score?: number;
    summary_of_intent?: string;
    purchase_intent_signal?: boolean;
    [key: string]: unknown;
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
    error?: string;
}

export interface SourceItem {
    postId?: string;
    id?: string;
    _id?: string;
    sourceKey?: string;
    sourceKeyValue?: string;
    pageName?: string;
    url?: string;
    facebookUrl?: string;
    inputUrl?: string;
    permalink_url?: string;
    text?: string;
    message?: string;
    caption?: string;
    content?: string;
    [key: string]: unknown;
}

const SOURCE_KEY_CANDIDATES = ["id", "postId", "_id", "url", "facebookUrl", "inputUrl", "permalink_url", "sourceKeyValue"] as const;

const getStringValue = (value: unknown): string => {
    return typeof value === "string" ? value.trim() : "";
};

const parsePct = (val: unknown): number => {
    if (typeof val === "string") return parseInt(val.replace('%', ''), 10) || 0;
    if (typeof val === "number") return val;
    return 0;
};

const resolveSourceItemByKey = (

    previousItems: SourceItem[],
    sourceKey?: string,
    sourceKeyValue?: string,
    sourceIndex?: number,
): SourceItem | undefined => {
    const targetValue = getStringValue(sourceKeyValue);

    if (sourceKey && targetValue) {
        const matchedByDeclaredKey = previousItems.find((item) => {
            const raw = (item as Record<string, unknown>)[sourceKey];
            return getStringValue(raw) === targetValue;
        });
        if (matchedByDeclaredKey) {
            if (!matchedByDeclaredKey.sourceKey) {
                matchedByDeclaredKey.sourceKey = sourceKey;
            }
            return matchedByDeclaredKey;
        }
    }

    if (targetValue) {
        for (const key of SOURCE_KEY_CANDIDATES) {
            const matched = previousItems.find((item) => {
                const raw = (item as Record<string, unknown>)[key];
                return getStringValue(raw) === targetValue;
            });
            if (matched) {
                if (!matched.sourceKey) {
                    matched.sourceKey = key;
                }
                return matched;
            }
        }

        // Dynamic fallback: scan all fields of previousItems to find a matching value
        for (const item of previousItems) {
            for (const key of Object.keys(item)) {
                const raw = (item as Record<string, unknown>)[key];
                if (getStringValue(raw) === targetValue) {
                    if (!item.sourceKey) {
                        item.sourceKey = key;
                    }
                    return item;
                }
            }
        }
    }

    if (typeof sourceIndex === "number" && sourceIndex >= 0 && sourceIndex < previousItems.length) {
        return previousItems[sourceIndex];
    }

    return undefined;
};

const getCanonicalPostUrl = (item?: SourceItem): string => {
    if (!item) return "";
    return getStringValue(item.facebookUrl)
        || getStringValue(item.url)
        || getStringValue(item.inputUrl)
        || getStringValue(item.permalink_url);
};

const getSourceIdentityValues = (item: SourceItem): string[] => {
    const values = [
        item.id,
        item.postId,
        item._id,
        item.sourceKeyValue,
        item.facebookUrl,
        item.url,
        item.inputUrl,
        item.permalink_url,
    ]
        .map((value) => getStringValue(value))
        .filter((value) => value.length > 0);

    return Array.from(new Set(values));
};

export type IntentClassification = "Interested" | "Neutral" | "Negative";

export interface IntentAnalysisPostGroup {
    groupKey: string;
    title: string;
    postUrl: string;
    items: ScrapedJobItem[];
    totalCount: number;
    interestedCount: number;
    neutralCount: number;
    negativeCount: number;
    interestedRatio: number;
    neutralRatio: number;
    negativeRatio: number;
    leadingClassification: IntentClassification;
}

export interface AnalysisDisplayEntry {
    key: string;
    value: string;
    valueType: "text" | "number" | "boolean" | "array" | "object";
}

export interface AnalysisDisplayBlock {
    id: "summary" | "metrics" | "evidence" | "additional";
    title: string;
    description: string;
    entries: AnalysisDisplayEntry[];
}

export interface AnalysisDisplayPreset {
    preferredKeys: string[];
    blockTitleOverrides?: Partial<Record<AnalysisDisplayBlock["id"], string>>;
    blockDescriptionOverrides?: Partial<Record<AnalysisDisplayBlock["id"], string>>;
}

export interface DynamicAnalysisValidationResult {
    isValid: boolean;
    inferredKind: "unknown" | "politicianSentiment" | "generic";
    issues: string[];
}

const DEFAULT_ANALYSIS_DISPLAY_PRESET: AnalysisDisplayPreset = {
    preferredKeys: [],
};

const ANALYSIS_DISPLAY_PRESETS: Record<string, AnalysisDisplayPreset> = {
    gemini: {
        preferredKeys: [
            "classification",
            "confidence_score",
            "purchase_intent_signal",
            "summary_of_intent",
            "summary",
            "sentiment",
            "keywords",
            "intentRatios",
            "commentThemes",
            "groups",
            "verdict",
            "evidence",
            "reasoning",
            "explanation",
        ],
        blockTitleOverrides: {
            summary: "AI Narrative",
            metrics: "Decision Metrics",
            evidence: "Evidence & Context",
            additional: "Extra Dynamic Fields",
        },
    },
    apify: {
        preferredKeys: [
            "summary",
            "text",
            "caption",
            "message",
            "keywords",
            "commentThemes",
            "source",
            "metadata",
        ],
        blockTitleOverrides: {
            summary: "Content Summary",
            metrics: "Quantitative Signals",
            evidence: "Source Payload",
            additional: "Additional Scraper Fields",
        },
    },
};

export const getAnalysisDisplayPresetForJob = (job?: ToolJob | null): AnalysisDisplayPreset => {
    const plugin = String(job?.plugin || "").toLowerCase().trim();
    return ANALYSIS_DISPLAY_PRESETS[plugin] || DEFAULT_ANALYSIS_DISPLAY_PRESET;
};

const INTENT_CLASSIFICATION_SCORE: Record<IntentClassification, number> = {
    Interested: 3,
    Neutral: 2,
    Negative: 1,
};

export const hasIntentAnalysisPayload = (analysis?: AnalysisResult | null): boolean => {
    if (!analysis) return false;
    return Boolean(
        analysis.classification ||
        analysis.confidence_score !== undefined ||
        analysis.summary_of_intent ||
        analysis.purchase_intent_signal !== undefined ||
        analysis.groups ||
        analysis.intentRatios
    );
};

export const normalizeIntentClassification = (analysis?: AnalysisResult | null): IntentClassification => {
    const classification = String(analysis?.classification || "").trim().toLowerCase();

    if (analysis?.purchase_intent_signal === true) return "Interested";
    if (!classification) return "Neutral";

    if (
        classification.includes("interested") ||
        classification.includes("buy") ||
        classification.includes("purchase") ||
        classification.includes("intent") ||
        classification.includes("สนใจ")
    ) {
        return "Interested";
    }

    if (
        classification.includes("negative") ||
        classification.includes("opposed") ||
        classification.includes("ต่อต้าน") ||
        classification.includes("เชิงลบ")
    ) {
        return "Negative";
    }

    return "Neutral";
};

export const getAnalysisClassificationLabel = (analysis?: AnalysisResult | null): string => {
    if (!analysis) return "";

    const rawClassification = typeof analysis.classification === "string"
        ? analysis.classification.trim()
        : "";

    if (rawClassification.length > 0) return rawClassification;

    if (analysis.purchase_intent_signal === true) return "Interested";
    if (analysis.purchase_intent_signal === false) return "Not Interested";

    return "";
};

export const isPurchaseIntentAnalysis = (analysis?: AnalysisResult | null): boolean => {
    if (!analysis) return false;

    if (
        analysis.purchase_intent_signal !== undefined ||
        analysis.groups !== undefined ||
        analysis.intentRatios !== undefined
    ) {
        return true;
    }

    const normalizedClassification = String(analysis.classification || "").trim().toLowerCase();
    if (!normalizedClassification) return false;

    return [
        "interested",
        "buy",
        "purchase",
        "intent",
        "negative",
        "opposed",
        "neutral",
        "สนใจ",
        "เชิงลบ",
        "ต่อต้าน",
    ].some((token) => normalizedClassification.includes(token));
};

export const formatAnalysisConfidence = (confidence?: number | string | null): string | null => {
    if (confidence === undefined || confidence === null || confidence === "") return null;
    const rawVal = typeof confidence === "string" ? confidence.replace(/%/g, "").trim() : confidence;
    const num = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal));
    if (Number.isNaN(num)) return null;
    const normalized = num <= 1 ? Math.round(num * 100) : Math.round(num);
    return `${normalized}%`;
};

export const getSchemaHintKeysFromJob = (job: ToolJob): string[] => {
    const preset = getAnalysisDisplayPresetForJob(job);
    const input = (job.input || {}) as Record<string, unknown>;
    const preProcessConfig = (input._preProcessConfig as Record<string, unknown> | undefined) || {};
    const config = (job.config as Record<string, unknown> | undefined) || {};

    const schemaObjectCandidates = [
        preProcessConfig.expectedOutputSchema,
        preProcessConfig.outputSchema,
        input.expectedOutputSchema,
        input.outputSchema,
        config.expectedOutputSchema,
        config.outputSchema,
    ].filter((v) => v && typeof v === "object");

    const rawPromptCandidates = [
        preProcessConfig.prompt,
        config.prompt,
        input.userInput,
        preProcessConfig.expectedOutputSchema,
        preProcessConfig.outputSchema,
    ]
        .map((v) => {
            if (typeof v === "string") return v;
            if (v && typeof v === "object") {
                try {
                    return JSON.stringify(v);
                } catch {
                    return "";
                }
            }
            return "";
        })
        .filter((v) => v.length > 0);

    const quotedTokenRegex = /["']([a-zA-Z][a-zA-Z0-9_]{1,80})["']/g;
    const jsonLikeKeyRegex = /["']([a-zA-Z][a-zA-Z0-9_]{1,80})["']\s*:/g;

    const tokens = new Set<string>();
    for (const text of rawPromptCandidates) {
        let match: RegExpExecArray | null;
        while ((match = quotedTokenRegex.exec(text)) !== null) {
            if (match[1]) tokens.add(match[1].trim());
        }
        while ((match = jsonLikeKeyRegex.exec(text)) !== null) {
            if (match[1]) tokens.add(match[1].trim());
        }
    }

    const blocked = new Set([
        "Goal",
        "System",
        "Prompt",
        "Expected",
        "Output",
        "Schema",
        "Potential",
        "Buyer",
        "Inquirer",
        "Neutral",
        "Negative",
        "Opposed",
        "description",
        "result",
        "input",
        "success",
        "config",
        "type",
        "properties",
        "items",
        "required",
        "title",
        "object",
        "array",
        "string",
        "number",
        "boolean",
    ]);

    const collectObjectKeys = (source: unknown, maxDepth = 3): string[] => {
        if (!source || typeof source !== "object") return [];

        const result = new Set<string>();

        const visit = (node: unknown, depth: number) => {
            if (!node || typeof node !== "object" || depth > maxDepth) return;

            const record = node as Record<string, unknown>;

            // JSON Schema style: { properties: { field: {...} } }
            const properties = record.properties;
            if (properties && typeof properties === "object") {
                for (const [key, child] of Object.entries(properties as Record<string, unknown>)) {
                    result.add(key.toLowerCase());
                    visit(child, depth + 1);
                }
            }

            const items = record.items;
            if (items) visit(items, depth + 1);

            // Plain object style: { field: value }
            for (const [key, child] of Object.entries(record)) {
                if (["properties", "items", "type", "required", "title", "description"].includes(key)) {
                    continue;
                }
                result.add(key.toLowerCase());
                visit(child, depth + 1);
            }
        };

        visit(source, 0);
        return Array.from(result);
    };

    const objectTokens = schemaObjectCandidates.flatMap((candidate) => collectObjectKeys(candidate));

    return preset.preferredKeys
        .map((token) => token.toLowerCase())
        .concat(Array.from(tokens).map((token) => token.toLowerCase()))
        .concat(objectTokens)
        .filter((token) => token.length > 1)
        .filter((token) => !blocked.has(token))
        .filter((token, index, arr) => arr.indexOf(token) === index);
};

export const getAnalysisDisplayEntries = (
    analysis?: AnalysisResult | null,
    preferredKeys: string[] = [],
    skipBlockList = false,
): AnalysisDisplayEntry[] => {
    if (!analysis) return [];

    const blockedKeys = skipBlockList ? new Set<string>() : new Set([
        "sentiment",
        "summary",
        "keywords",
        "intentRatios",
        "postType",
        "multiLabels",
        "politicians",
        "commentThemes",
        "postUrl",
        "groups",
        "verdict",
        "conversionLeader",
        "classification",
        "confidence_score",
        "summary_of_intent",
        "purchase_intent_signal",
    ] as string[]);

    const preferredSet = new Set(preferredKeys.map((k) => String(k).toLowerCase()));

    const stringifyValue = (value: unknown): string => {
        try {
            const asJson = JSON.stringify(value, null, 2);
            return asJson || String(value);
        } catch {
            return String(value);
        }
    };

    const clip = (text: string, limit = 1600): string => {
        if (text.length <= limit) return text;
        return `${text.slice(0, limit)}...`;
    };

    const entries = Object.entries(analysis)
        .filter(([key, value]) => !blockedKeys.has(key) && value !== null && value !== undefined)
        .map(([key, value]) => {
            if (Array.isArray(value)) {
                const primitiveOnly = value.every((v) => v === null || ["string", "number", "boolean"].includes(typeof v));
                const text = primitiveOnly
                    ? value.map((v) => String(v)).join(", ")
                    : stringifyValue(value);
                return {
                    key,
                    value: clip(text),
                    valueType: "array" as const,
                };
            }

            if (typeof value === "object" && !(value instanceof Date)) {
                return {
                    key,
                    value: clip(stringifyValue(value)),
                    valueType: "object" as const,
                };
            }

            if (typeof value === "number") {
                return { key, value: String(value), valueType: "number" as const };
            }

            if (typeof value === "boolean") {
                return { key, value: String(value), valueType: "boolean" as const };
            }

            return {
                key,
                value: clip(String(value)),
                valueType: "text" as const,
            };
        });

    if (preferredSet.size === 0) return entries;

    return entries.sort((a, b) => {
        const aIdx = preferredKeys.findIndex((k) => k.toLowerCase() === a.key.toLowerCase());
        const bIdx = preferredKeys.findIndex((k) => k.toLowerCase() === b.key.toLowerCase());
        const aRank = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
        const bRank = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
        if (aRank !== bRank) return aRank - bRank;
        return a.key.localeCompare(b.key);
    });
};

export const getAnalysisDisplayBlocks = (
    analysis?: AnalysisResult | null,
    preferredKeys: string[] = [],
    preset?: AnalysisDisplayPreset,
    skipBlockList = false,
): AnalysisDisplayBlock[] => {
    const entries = getAnalysisDisplayEntries(analysis, preferredKeys, skipBlockList);
    if (entries.length === 0) return [];

    const summaryEntries: AnalysisDisplayEntry[] = [];
    const metricEntries: AnalysisDisplayEntry[] = [];
    const evidenceEntries: AnalysisDisplayEntry[] = [];
    const additionalEntries: AnalysisDisplayEntry[] = [];

    const isSummaryKey = (key: string) => {
        const normalized = key.toLowerCase();
        return ["summary", "overview", "conclusion", "recommendation", "insight", "intent", "explain", "analysis_note"]
            .some((token) => normalized.includes(token));
    };

    const isMetricKey = (key: string) => {
        const normalized = key.toLowerCase();
        return ["score", "confidence", "ratio", "rate", "percent", "count", "total", "signal", "rank"]
            .some((token) => normalized.includes(token));
    };

    const isEvidenceKey = (key: string) => {
        const normalized = key.toLowerCase();
        return ["reason", "evidence", "reference", "example", "quote", "comment", "source", "support", "detail"]
            .some((token) => normalized.includes(token));
    };

    entries.forEach((entry) => {
        if (isSummaryKey(entry.key) && entry.valueType === "text") {
            summaryEntries.push(entry);
            return;
        }

        if (entry.valueType === "number" || entry.valueType === "boolean" || isMetricKey(entry.key)) {
            metricEntries.push(entry);
            return;
        }

        if (entry.valueType === "array" || entry.valueType === "object" || isEvidenceKey(entry.key)) {
            evidenceEntries.push(entry);
            return;
        }

        additionalEntries.push(entry);
    });

    const blocks: AnalysisDisplayBlock[] = [
        {
            id: "summary" as const,
            title: "Summary Signals",
            description: "High-level narratives inferred from this output shape",
            entries: summaryEntries,
        },
        {
            id: "metrics" as const,
            title: "Metrics & Flags",
            description: "Scores, ratios, counts, and boolean indicators",
            entries: metricEntries,
        },
        {
            id: "evidence" as const,
            title: "Evidence Payload",
            description: "Structured arrays/objects and supporting details",
            entries: evidenceEntries,
        },
        {
            id: "additional" as const,
            title: "Additional Fields",
            description: "Other dynamic fields found in result",
            entries: additionalEntries,
        },
    ].filter((block) => block.entries.length > 0);

    if (!preset) return blocks;

    return blocks.map((block) => ({
        ...block,
        title: preset.blockTitleOverrides?.[block.id] || block.title,
        description: preset.blockDescriptionOverrides?.[block.id] || block.description,
    }));
};

export const validateDynamicAnalysisPayload = (
    analysis: unknown,
): DynamicAnalysisValidationResult => {
    if (!analysis || typeof analysis !== "object") {
        return {
            isValid: false,
            inferredKind: "unknown",
            issues: ["analysis is not an object"],
        };
    }

    const raw = analysis as Record<string, unknown>;
    const keys = Object.keys(raw);
    if (keys.length === 0) {
        return {
            isValid: false,
            inferredKind: "unknown",
            issues: ["analysis object is empty"],
        };
    }

    const issues: string[] = [];
    let inferredKind: DynamicAnalysisValidationResult["inferredKind"] = "generic";

    const hasPoliticianShape =
        typeof raw.politician_name === "string" ||
        Array.isArray(raw.associated_comments) ||
        (raw.sentiment_summary && typeof raw.sentiment_summary === "object");

    if (hasPoliticianShape) {
        inferredKind = "politicianSentiment";

        if (typeof raw.politician_name !== "string" || raw.politician_name.trim().length === 0) {
            issues.push("politician_name should be a non-empty string");
        }

        if (!Array.isArray(raw.associated_comments)) {
            issues.push("associated_comments should be an array of strings");
        } else if (raw.associated_comments.some((item) => typeof item !== "string")) {
            issues.push("associated_comments contains non-string value");
        }

        if (!raw.sentiment_summary || typeof raw.sentiment_summary !== "object") {
            issues.push("sentiment_summary should be an object");
        } else {
            const sentimentSummary = raw.sentiment_summary as Record<string, unknown>;
            if (typeof sentimentSummary.sentiment !== "string") {
                issues.push("sentiment_summary.sentiment should be a string");
            }
            if (typeof sentimentSummary.description !== "string") {
                issues.push("sentiment_summary.description should be a string");
            }
        }
    }

    return {
        isValid: issues.length === 0,
        inferredKind,
        issues,
    };
};

export const groupIntentAnalysisByPost = (items: ScrapedJobItem[], job?: ToolJob): IntentAnalysisPostGroup[] => {
    const groups = new Map<string, IntentAnalysisPostGroup>();

    // Extract previousResults items to lookup post URLs by postId
    const previousItems = (job?.input?.previousResults as { items?: SourceItem[] } | undefined)?.items || [];

    // Build a map of postId -> post_url from previousResults
    const postIdToUrlMap = new Map<string, string>();
    previousItems.forEach(prevItem => {
        const postId = getStringValue(prevItem.postId) || getStringValue(prevItem.id) || getStringValue(prevItem._id);
        const postUrl = getCanonicalPostUrl(prevItem);
        if (postId && postUrl) {
            postIdToUrlMap.set(postId, postUrl);
        }
    });

    items.forEach((item, index) => {
        const analysis = item.analysis as AnalysisResult | undefined;
        if (!hasIntentAnalysisPayload(analysis)) return;

        const rawItem = item as ScrapedJobItem & Record<string, unknown>;

        // Try to resolve post URL: first from item data, then from previousResults map via sourceKeyValue/postId
        let postUrl = getStringValue(item.facebookUrl) || getStringValue(item.url) || getStringValue(analysis?.postUrl);
        if (!postUrl && item.sourceKeyValue) {
            const sourceKeyValue = getStringValue(item.sourceKeyValue);
            postUrl = postIdToUrlMap.get(sourceKeyValue) || sourceKeyValue;
        }
        if (!postUrl && item.postId) {
            const postId = getStringValue(item.postId);
            postUrl = postIdToUrlMap.get(postId) || postId;
        }
        if (!postUrl) {
            postUrl = "";
        }

        const groupKey = postUrl || `post-${index}`;
        const existing = groups.get(groupKey);
        const title = String(
            (typeof rawItem.postTitle === "string" && rawItem.postTitle.trim()) ||
            (typeof rawItem.pageName === "string" && rawItem.pageName.trim()) ||
            postUrl ||
            groupKey,
        );
        const classification = normalizeIntentClassification(analysis);

        const nextGroup: IntentAnalysisPostGroup = existing || {
            groupKey,
            title,
            postUrl,
            items: [],
            totalCount: 0,
            interestedCount: 0,
            neutralCount: 0,
            negativeCount: 0,
            interestedRatio: 0,
            neutralRatio: 0,
            negativeRatio: 0,
            leadingClassification: "Neutral",
        };

        nextGroup.items.push(item);
        nextGroup.totalCount += 1;

        if (classification === "Interested") nextGroup.interestedCount += 1;
        else if (classification === "Negative") nextGroup.negativeCount += 1;
        else nextGroup.neutralCount += 1;

        nextGroup.interestedRatio = nextGroup.totalCount > 0 ? Math.round((nextGroup.interestedCount / nextGroup.totalCount) * 100) : 0;
        nextGroup.neutralRatio = nextGroup.totalCount > 0 ? Math.round((nextGroup.neutralCount / nextGroup.totalCount) * 100) : 0;
        nextGroup.negativeRatio = nextGroup.totalCount > 0 ? Math.max(0, 100 - nextGroup.interestedRatio - nextGroup.neutralRatio) : 0;

        const leading: Array<{ classification: IntentClassification; score: number }> = [
            { classification: "Interested", score: nextGroup.interestedCount },
            { classification: "Neutral", score: nextGroup.neutralCount },
            { classification: "Negative", score: nextGroup.negativeCount },
        ];
        nextGroup.leadingClassification = leading.sort((a, b) => b.score - a.score)[0]?.classification || "Neutral";

        groups.set(groupKey, nextGroup);
    });

    return Array.from(groups.values()).sort((a, b) => {
        const interestedDelta = b.interestedRatio - a.interestedRatio;
        if (interestedDelta !== 0) return interestedDelta;
        const scoreDelta = INTENT_CLASSIFICATION_SCORE[b.leadingClassification] - INTENT_CLASSIFICATION_SCORE[a.leadingClassification];
        if (scoreDelta !== 0) return scoreDelta;
        return b.totalCount - a.totalCount;
    });
};

export const getJobStatus = (job: ToolJob | ToolRunGrouped): JobStatus => {
    if ('status' in job && job.status) {
        const normalized = job.status.toLowerCase();
        if (normalized === 'running') return 'active';
        if (normalized === 'cancelled') return 'cancelled';
        return normalized;
    }
    if ('state' in job && job.state) {
        const normalized = job.state.toLowerCase();
        if (normalized === 'cancelled') return 'cancelled';
    }
    if ('error' in job && job.error) return 'failed';
    if (job.state) {
        const normalized = job.state.toLowerCase();
        if (normalized === 'running') return 'active';
        return normalized as JobStatus;
    }
    if ('processed' in job && job.processed) return 'completed';
    return 'active';
};

export const getItemCount = (job: ToolJob): number => {
    if (!job.result) return 0;
    if (Array.isArray(job.result)) return job.result.length;
    if (typeof job.result === "object") {
        if (typeof job.result.itemCount === 'number' && job.result.itemCount > 0) return job.result.itemCount;
        if (Array.isArray(job.result.items)) return job.result.items.length;
        if (!("items" in job.result)) return 1; // Flat data (single object)
    }

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
    const isAnalysisDebug = process.env.NODE_ENV !== "production";
    const jobTraceId = String(job.jobId || job.id || job._id || "unknown-job");
    const ANALYSIS_SIGNAL_KEYS = [
        "classification",
        "confidence_score",
        "summary_of_intent",
        "purchase_intent_signal",
        "sentiment",
        "sentiment_summary",
        "summary",
        "keywords",
        "groups",
        "verdict",
        "intentRatios",
        "commentThemes",
        "postType",
        "politicians",
        "politician_name",
        "associated_comments",
    ] as const;

    const RESERVED_RESULT_KEYS = new Set([
        "sourceIndex",
        "sourceKey",
        "sourceKeyValue",
        "url",
        "facebookUrl",
        "postUrl",
        "inputUrl",
        "permalink_url",
        "id",
        "_id",
        "postId",
    ]);

    const RESERVED_RESULT_KEYS_BY_PLUGIN: Record<string, string[]> = {
        apify: [
            "commentId",
            "profileId",
            "profileName",
            "profilePicture",
            "timestamp",
            "time",
            "media",
            "reactionLikeCount",
            "reactionLoveCount",
            "reactionCareCount",
            "reactionHahaCount",
            "reactionWowCount",
            "reactionSadCount",
            "reactionAngryCount",
        ],
        gemini: [
            "model",
            "tokenUsage",
            "promptVersion",
            "traceId",
        ],
    };

    const getReservedKeysForPlugin = () => {
        const extra = RESERVED_RESULT_KEYS_BY_PLUGIN[pluginLower] || [];
        return new Set([...Array.from(RESERVED_RESULT_KEYS), ...extra]);
    };

    const logAnalysisSynthesis = (
        source: string,
        payload: {
            itemIndex?: number;
            synthesizedKeys?: string[];
            reason: string;
        },
    ) => {
        if (!isAnalysisDebug) return;
        console.debug("[ToolJobUtils][debug] analysis synthesis", {
            plugin: pluginLower || "unknown",
            jobTraceId,
            source,
            ...payload,
        });
    };

    const extractAnalysisPayload = (
        rawItem: Record<string, unknown>,
        source: string,
        itemIndex?: number,
    ): AnalysisResult | undefined => {
        const direct = rawItem.analysis;

        // Helper to unwrap nested analysis key (e.g. { analysis: { ... } })
        const unwrapAnalysis = (obj: Record<string, unknown>): Record<string, unknown> => {
            const keys = Object.keys(obj);
            if (keys.length === 1 && keys[0].toLowerCase() === "analysis") {
                const nested = obj[keys[0]];
                if (nested && typeof nested === "object" && !Array.isArray(nested)) {
                    return nested as Record<string, unknown>;
                }
            }
            return obj;
        };

        if (direct) {
            if (typeof direct === "object" && !Array.isArray(direct)) {
                return unwrapAnalysis(direct as Record<string, unknown>) as AnalysisResult;
            }
            if (typeof direct === "string") {
                try {
                    const parsed = JSON.parse(direct);
                    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                        return unwrapAnalysis(parsed as Record<string, unknown>) as AnalysisResult;
                    }
                } catch {
                    // Ignore JSON parsing errors and fallback to regex/signal detection
                }
            }
        }

        const hasSignal = ANALYSIS_SIGNAL_KEYS.some((key) => rawItem[key] !== undefined);
        const hasDynamicPattern = Object.keys(rawItem).some((key) => {
            const normalized = key.toLowerCase();
            return (
                normalized.endsWith("_summary") ||
                normalized.endsWith("_comments") ||
                normalized.includes("analysis") ||
                normalized.includes("sentiment")
            );
        });
        if (!hasSignal && !hasDynamicPattern) return undefined;

        const reservedKeys = getReservedKeysForPlugin();
        const payload: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rawItem)) {
            if (reservedKeys.has(key)) continue;
            if (value === undefined || value === null) continue;
            payload[key] = value;
        }

        const synthesizedKeys = Object.keys(payload);
        if (synthesizedKeys.length === 0) {
            logAnalysisSynthesis(source, {
                itemIndex,
                reason: "signal-detected-but-empty-payload",
                synthesizedKeys,
            });
            return undefined;
        }

        const unwrappedPayload = unwrapAnalysis(payload);
        const unwrappedKeys = Object.keys(unwrappedPayload);

        const validation = validateDynamicAnalysisPayload(unwrappedPayload);
        if (!validation.isValid) {
            logAnalysisSynthesis(source, {
                itemIndex,
                reason: `validation-issues:${validation.issues.join(" | ")}`,
                synthesizedKeys: unwrappedKeys,
            });
        }

        logAnalysisSynthesis(source, {
            itemIndex,
            reason: "synthesized-from-top-level-fields",
            synthesizedKeys: unwrappedKeys,
        });
        return unwrappedPayload as AnalysisResult;
    };

    // If it's not a Gemini job, just return result.items or empty list
    if (pluginLower !== "gemini") {
        let rawItems: unknown[] = [];
        if (job.result) {
            if (Array.isArray(job.result)) {
                rawItems = job.result;
            } else if (typeof job.result === "object") {
                if (Array.isArray(job.result.items)) {
                    rawItems = job.result.items;
                } else if (!("items" in job.result)) {
                    rawItems = [job.result];
                }
            }
        }
        const previousItems = (job.input?.previousResults as { items?: SourceItem[] } | undefined)?.items || [];

        return rawItems.map((item, idx) => {
            const raw = item as Record<string, unknown>;
            const sourceItem = resolveSourceItemByKey(
                previousItems,
                raw.sourceKey as string | undefined,
                raw.sourceKeyValue as string | undefined,
                raw.sourceIndex as number | undefined,
            );
            const canonicalPostUrl = getCanonicalPostUrl(sourceItem);
            return {
                ...raw,
                analysis: extractAnalysisPayload(raw, "non-gemini-items-map", idx),
                postUrl: getStringValue(raw.postUrl) || canonicalPostUrl,
                url: getStringValue(raw.url) || canonicalPostUrl,
                facebookUrl: getStringValue(raw.facebookUrl) || canonicalPostUrl,
            } as unknown as ScrapedJobItem;
        });
    }

    const previousItems = (job.input?.previousResults as { items?: SourceItem[] } | undefined)?.items || [];
    let geminiItems: Record<string, unknown>[] = [];
    if (job.result) {
        if (Array.isArray(job.result)) {
            geminiItems = job.result as Record<string, unknown>[];
        } else if (typeof job.result === "object") {
            if (Array.isArray(job.result.items)) {
                geminiItems = job.result.items as Record<string, unknown>[];
            } else if (!("items" in job.result)) {
                geminiItems = [job.result as Record<string, unknown>];
            }
        } else if (typeof job.result === "string") {
            geminiItems = [{ summary: job.result }];
        }
    }
    const hasFlatResult = !!(
        job.result && (
            (typeof job.result === "object" && !Array.isArray(job.result) && !("items" in job.result)) ||
            typeof job.result === "string"
        )
    );

    const wrapResult = (job.config as Record<string, unknown> | undefined)?.wrapResult === true;
    const isAggregate = (job.config as Record<string, unknown> | undefined)?.mode === "aggregate";
    const usedGeminiIndexes = new Set<number>();

    if ((isAggregate || hasFlatResult) && geminiItems.length > 0) {
        return geminiItems.map((item, idx) => {
            const raw = item as Record<string, unknown>;
            const rawPostId = getStringValue(raw.postId) || getStringValue(raw.id) || getStringValue(raw._id);
            let prevMatchUrl = "";
            if (rawPostId && previousItems.length > 0) {
                if (idx < previousItems.length) {
                    const candidate = previousItems[idx];
                    const candPostId = getStringValue(candidate.postId) || getStringValue(candidate.id) || getStringValue(candidate._id);
                    if (candPostId === rawPostId) {
                        prevMatchUrl = getCanonicalPostUrl(candidate);
                    }
                }
                if (!prevMatchUrl) {
                    const match = previousItems.find(
                        (p) =>
                            getStringValue(p.postId) === rawPostId ||
                            getStringValue(p.id) === rawPostId ||
                            getStringValue(p._id) === rawPostId
                    );
                    if (match) {
                        prevMatchUrl = getCanonicalPostUrl(match);
                    }
                }
            }

            const fallbackUrl =
                getStringValue(raw.postUrl) ||
                getStringValue(raw.facebookUrl) ||
                getStringValue(raw.url) ||
                prevMatchUrl ||
                getStringValue(raw.inputUrl) ||
                getStringValue(raw.permalink_url) ||
                (getStringValue(raw.sourceKeyValue) !== "aggregate" && getStringValue(raw.sourceKeyValue) !== "flat-result" ? getStringValue(raw.sourceKeyValue) : "");

            const normalizedAnalysis = wrapResult
                ? extractAnalysisPayload(raw, isAggregate ? "gemini-aggregate-wrapResult" : "gemini-flat-wrapResult", idx)
                : ((raw.analysis as AnalysisResult | undefined) || extractAnalysisPayload(raw, isAggregate ? "gemini-aggregate-fallback" : "gemini-flat-fallback", idx));

            return {
                ...raw,
                sourceIndex: idx,
                sourceKey: isAggregate ? "aggregate" : "flat-result",
                sourceKeyValue: isAggregate ? "aggregate" : "flat-result",
                analysis: normalizedAnalysis,
                postUrl: getStringValue(raw.postUrl) || fallbackUrl,
                url: getStringValue(raw.url) || fallbackUrl,
                facebookUrl: getStringValue(raw.facebookUrl) || fallbackUrl,
            } as unknown as ScrapedJobItem;
        });
    }

    if (previousItems.length === 0 && geminiItems.length > 0) {
        return geminiItems.map((item, idx) => {
            const raw = item as Record<string, unknown>;
            const fallbackUrl =
                getStringValue(raw.postUrl) ||
                getStringValue(raw.facebookUrl) ||
                getStringValue(raw.url) ||
                getStringValue(raw.inputUrl) ||
                getStringValue(raw.permalink_url) ||
                getStringValue(raw.sourceKeyValue);

            const normalizedAnalysis = wrapResult
                ? extractAnalysisPayload(raw, "gemini-no-previousItems-wrapResult", idx)
                : ((raw.analysis as AnalysisResult | undefined) || extractAnalysisPayload(raw, "gemini-no-previousItems-fallback", idx));

            return {
                ...raw,
                sourceIndex: typeof raw.sourceIndex === "number" ? raw.sourceIndex : idx,
                sourceKey: getStringValue(raw.sourceKey) || "postId",
                sourceKeyValue: getStringValue(raw.sourceKeyValue) || getStringValue(raw.postId) || getStringValue(raw.id) || getStringValue(raw._id),
                analysis: normalizedAnalysis,
                postUrl: getStringValue(raw.postUrl) || fallbackUrl,
                url: getStringValue(raw.url) || fallbackUrl,
                facebookUrl: getStringValue(raw.facebookUrl) || fallbackUrl,
            } as unknown as ScrapedJobItem;
        });
    }

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

    const findGeminiMatchForSource = (prevItem: SourceItem, prevIndex: number) => {
        const identityValues = getSourceIdentityValues(prevItem);

        // 1) Strongest: explicit sourceIndex mapping
        for (let i = 0; i < geminiItems.length; i++) {
            if (usedGeminiIndexes.has(i)) continue;
            const g = geminiItems[i];
            if (typeof g.sourceIndex === "number" && g.sourceIndex === prevIndex) {
                usedGeminiIndexes.add(i);
                return g;
            }
        }

        // 1.5) Fallback for error items by index:
        // If the gemini item at prevIndex is an error (i.e. has 'error' key) and is not yet used, match it.
        const candidateError = geminiItems[prevIndex];
        if (candidateError && typeof candidateError === "object" && !usedGeminiIndexes.has(prevIndex)) {
            if ("error" in candidateError || (candidateError.analysis && typeof candidateError.analysis === "object" && "error" in (candidateError.analysis as Record<string, unknown>))) {
                usedGeminiIndexes.add(prevIndex);
                return candidateError;
            }
        }

        // 2) Explicit key/value mapping from sourceKey + sourceKeyValue
        for (let i = 0; i < geminiItems.length; i++) {
            if (usedGeminiIndexes.has(i)) continue;
            const g = geminiItems[i];
            const sourceKey = getStringValue(g.sourceKey);
            const sourceVal = getStringValue(g.sourceKeyValue);
            if (!sourceKey || !sourceVal) continue;
            const currentVal = getStringValue((prevItem as Record<string, unknown>)[sourceKey]);
            if (currentVal && currentVal === sourceVal) {
                usedGeminiIndexes.add(i);
                return g;
            }
        }

        // 3) Fallback: sourceKeyValue equals one of known source identifiers/URLs
        for (let i = 0; i < geminiItems.length; i++) {
            if (usedGeminiIndexes.has(i)) continue;
            const g = geminiItems[i];
            const sourceVal = getStringValue(g.sourceKeyValue);
            if (!sourceVal) continue;
            if (identityValues.includes(sourceVal)) {
                usedGeminiIndexes.add(i);
                return g;
            }
        }

        // 3.5) Dynamic scan fallback: match if sourceKeyValue matches any field value in prevItem
        for (let i = 0; i < geminiItems.length; i++) {
            if (usedGeminiIndexes.has(i)) continue;
            const g = geminiItems[i];
            const sourceVal = getStringValue(g.sourceKeyValue);
            if (!sourceVal) continue;

            for (const key of Object.keys(prevItem)) {
                const val = getStringValue((prevItem as Record<string, unknown>)[key]);
                if (val && val === sourceVal) {
                    g.sourceKey = key;
                    usedGeminiIndexes.add(i);
                    return g;
                }
            }
        }

        // 4) Fallback: match by postId
        for (let i = 0; i < geminiItems.length; i++) {
            if (usedGeminiIndexes.has(i)) continue;
            const g = geminiItems[i];
            const gPostId = getStringValue(g.postId) || getStringValue(g.id) || getStringValue(g._id);
            if (!gPostId) continue;
            const prevPostId = getStringValue(prevItem.postId) || getStringValue(prevItem.id) || getStringValue(prevItem._id);
            if (gPostId === prevPostId) {
                usedGeminiIndexes.add(i);
                return g;
            }
        }

        return undefined;
    };

    // Map each previous scraper item to a merged item with Gemini analysis
    return previousItems.map((prevItem, idx) => {
        const matchedGemini = findGeminiMatchForSource(prevItem, idx);

        // Build analysis: support both nested .analysis and wrapResult top-level payloads
        let analysis: AnalysisResult | undefined = matchedGemini?.analysis as AnalysisResult | undefined;
        if (!analysis && matchedGemini) {
            analysis = extractAnalysisPayload(
                matchedGemini as Record<string, unknown>,
                wrapResult
                    ? "gemini-merge-wrapResult"
                    : "gemini-merge-fallback",
                idx,
            );
        }

        const canonicalPostUrl = getCanonicalPostUrl(prevItem);
        const hasError = matchedGemini && "error" in matchedGemini;

        return {
            ...prevItem,
            sourceIndex: idx,
            sourceKey: matchedGemini?.sourceKey || "postId",
            analysis: analysis || (hasError ? { error: String(matchedGemini.error) } as unknown as AnalysisResult : undefined),
            sourceKeyValue: matchedGemini?.sourceKeyValue || prevItem.postId || prevItem.id || prevItem._id,
            postUrl: canonicalPostUrl,
            url: getStringValue(prevItem.url) || canonicalPostUrl,
            facebookUrl: getStringValue(prevItem.facebookUrl) || canonicalPostUrl,
            error: hasError ? String(matchedGemini.error) : undefined,
        } as unknown as ScrapedJobItem;
    });
};

export const groupFlatAnalysis = (analysis?: AnalysisResult | null): Array<{ id: string, analysis: AnalysisResult }> => {
    if (!analysis) return [];

    const groups = new Map<string, Record<string, object>>();
    const keys = Object.keys(analysis);

    keys.forEach(key => {
        const match = key.match(/^post_([^_]+)_(.*)$/);
        if (match) {
            const [, id, field] = match;
            if (!groups.has(id)) groups.set(id, {});
            groups.get(id)![field] = analysis[key] as object;
        }
    });

    if (groups.size === 0) return [];

    return Array.from(groups.entries()).map(([id, data]) => {
        const result: AnalysisResult = { ...data };

        if (data.purchase_intent) result.classification = String(data.purchase_intent);
        if (data.summary) result.summary = String(data.summary);

        const buy = parsePct(data.ratio_want_to_buy);
        const neutral = parsePct(data.ratio_indifferent);
        const negative = parsePct(data.ratio_negative);

        if (buy !== 0 || neutral !== 0 || negative !== 0) {
            result.intentRatios = {
                buyIntent: buy,
                notInterested: neutral,
                negative: negative
            };
        }

        return { id, analysis: result };
    });
};

export const groupMetricsByPostId = (
    entries: AnalysisDisplayEntry[]
): Record<string, Array<AnalysisDisplayEntry & { field?: string }>> => {
    return entries.reduce((acc, entry) => {
        const match = entry.key.match(/^post_([^_]+)_(.+)$/);
        if (match) {
            const [, postId, field] = match;
            if (!acc[postId]) acc[postId] = [];
            acc[postId].push({ ...entry, field });
        } else {
            if (!acc['_ungrouped']) acc['_ungrouped'] = [];
            acc['_ungrouped'].push(entry);
        }
        return acc;
    }, {} as Record<string, Array<AnalysisDisplayEntry & { field?: string }>>);
};

export interface BuyIntentAnalysis {
    value: number;
    color: 'emerald' | 'amber' | 'orange' | 'slate';
    entry?: AnalysisDisplayEntry;
}

export function calculateBuyIntent(
    entries: Array<AnalysisDisplayEntry & { field?: string }>
): BuyIntentAnalysis {
    const buyIntentEntry = entries.find(e =>
        e.key.toLowerCase().includes('want_to_buy') ||
        e.key.toLowerCase().includes('buy')
    );

    const value = buyIntentEntry ?
        parseInt(String(buyIntentEntry.value).replace('%', ''), 10) : 0;

    const color =
        value >= 70 ? 'emerald' :
            value >= 40 ? 'amber' :
                value > 0 ? 'orange' : 'slate';

    return { value, color, entry: buyIntentEntry };
}
