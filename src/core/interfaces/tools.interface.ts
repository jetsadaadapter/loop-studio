import type { Paginated } from "./common.interface";

export type ToolParamType = "string" | "number" | "boolean" | "url" | "select" | "array";

export interface ToolParam {
    id: string;
    toolId: string;
    key: string;
    label: string;
    type: ToolParamType;
    defaultValue: string | null;
    transform: string | null;
    placeholder: string | null;
    options: string[] | null;
    required: boolean;
    sortOrder: number;
}

export interface ToolScript {
    id: string;
    toolId: string;
    plugin: string;
    config: {
        model?: string;
        prompt?: string;
        itemKey?: string;
        useInput?: boolean;
        actorId?: string;
        [key: string]: unknown;
    };
    label: string;
    description: string | null;
    sortOrder: number;
}

export interface Tool {
    id: string;
    name: string;
    description: string | null;
    accentColor?: string | null;
    sortOrder: number;
    isActive: boolean;
    userId: string;
    params: ToolParam[];
    scripts: ToolScript[];
    createdAt: string;
    updatedAt: string;
}

export interface AppTool {
    id: string;
    appId: string;
    toolId: string;
    tool: Tool;
    sortOrder: number;
    createdAt: string;
}

export interface ToolJob {
    id: string;
    _id?: string;
    jobId: string;
    plugin: string;
    toolId: string;
    userId: string;
    config?: Record<string, unknown>;
    input: {
        userInput?: string;
        startUrls?: string[];
        previousResults?: unknown;
        [key: string]: unknown;
    };
    result?: {
        itemCount: number;
        items: Array<{
            sourceIndex: number;
            sourceKey: string;
            sourceKeyValue: string;
            analysis: Record<string, unknown>;
            [key: string]: unknown;
        }>;
    };
    resultId?: string | null;
    runId?: string;
    processed?: string | null;
    status?: 'running' | 'completed' | 'failed' | 'queued';
    state: string;
    error?: string | null | Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export interface ToolRun {
    runId: string;
    toolId: string;
    jobs: ToolJob[];
}

export interface GetToolRunResponse {
    success: boolean;
    message: string;
    data: ToolRun;
}

export type GetToolJobsResponse = Paginated<ToolJob>;
export interface GetToolJobDetailResponse {
    success: boolean;
    message: string;
    data: ToolJob;
}
export interface GetToolDetailResponse {
    success: boolean;
    message: string;
    data: Tool;
}

export interface ToolTestPromptResult {
    success?: boolean;
    error?: string;
    result?: {
        preview: ToolTestPromptResultPreview;
        [key: string]: unknown;
    };
}

export interface ToolTestPromptResultPreview {
    startUrls?: string[];
    goal?: string;
    generatedSystemPrompt?: string;
    expectedOutputSchema?: unknown;
    [key: string]: unknown;
}

