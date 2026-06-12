export interface ManageApiKeyItem {
    id: string;
    appId: string;
    name: string;
    ownerId: string;
    isActive: boolean;
    webhookUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ManageApiKeyPayload {
    name?: string;
    webhookUrl?: string;
    isActive?: boolean;
}

export interface ManageApiKeyListResponse {
    success: boolean;
    message?: string;
    data: ManageApiKeyItem[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ManageApiKeyCreatedData {
    appId: string;
    secret: string;
    name: string;
    createdAt: string;
}

export interface ManageApiKeyMutationResponse {
    success: boolean;
    message?: string;
    data: ManageApiKeyItem | ManageApiKeyCreatedData | ManageApiKeyItem[];
}
