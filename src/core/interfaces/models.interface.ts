import type { ManageApiEnvelope } from "./common.interface";

export type ManageAiModelApiItem = {
    id: string;
    modelSlug: string;
    name: string;
    provider: string;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ManageAiApiListItem = ManageAiModelApiItem;

export type ManageAiModelPayload = {
    modelSlug: string;
    name: string;
    provider: string;
    isActive: boolean;
    isDefault: boolean;
};

export type ManageAiListResponse = ManageApiEnvelope<ManageAiModelApiItem[]>;
export type ManageAiMutationResponse = ManageApiEnvelope<ManageAiModelApiItem>;
