import type { ManageApiEnvelope } from "./common.interface";

export type AppTag = {
    id: string;
    tagId?: string;
    name: string;
    /** Hex colour string e.g. "#0F6E56" */
    color: string;
    createdAt: string;
    updatedAt?: string;
    userId?: string;
};

export type ManageTagApiItem = {
    id: string;
    name: string;
    color: string;
    userId?: string;
    createdAt: string;
    updatedAt: string;
};

export type ManageTagPayload = {
    name: string;
    color: string;
};

export type ManageTagListResponse = ManageApiEnvelope<ManageTagApiItem[]>;
export type ManageTagSingleResponse = ManageApiEnvelope<ManageTagApiItem>;
