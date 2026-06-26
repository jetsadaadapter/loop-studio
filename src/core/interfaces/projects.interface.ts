export interface ProjectItem {
    id: string;
    name: string;
    credits: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
    connectedAppIds?: string[];
    connectedToolIds?: string[];
    connectedApiKeyIds?: string[];
}

export interface ProjectPayload {
    name?: string;
}

export interface ProjectListResponse {
    success: boolean;
    message?: string;
    data: ProjectItem[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ProjectMutationResponse {
    success: boolean;
    message?: string;
    data: ProjectItem | ProjectItem[];
}
