export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type Paginated<T> = {
    data: T[];
    meta: PaginationMeta;
};

export type ManageApiEnvelope<T> = {
    success: boolean;
    message?: string;
    data: T;
    meta?: PaginationMeta;
};
