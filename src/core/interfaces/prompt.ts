import type { ManageAiApiListItem } from "@/core/interfaces/models.interface";

export interface PromptModelInfo extends ManageAiApiListItem {
    id: string;
    modelSlug: string;
    name: string;
    provider: string;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PromptItem {
    id: string;
    name: string;
    prompt: string;
    description: string | null;
    type: "system" | "user";
    version: string;
    remark: string | null;
    visibility: "public" | "private";
    modelId: string;
    model?: PromptModelInfo | null;
    userId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PromptsResponse {
    success: boolean;
    message: string;
    data: PromptItem[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreatePromptPayload {
    userId?: string;
    name: string;
    prompt: string;
    description?: string;
    type: "system" | "user";
    version: string;
    visibility: "public" | "private";
    remark?: string;
    modelId: string;
}
