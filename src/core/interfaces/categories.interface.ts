import type { ManageApiEnvelope } from "./common.interface";

export type CategoryInfo = {
    id: string;
    name: string;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type ManageCategoryListResponse = ManageApiEnvelope<CategoryInfo[]>;
