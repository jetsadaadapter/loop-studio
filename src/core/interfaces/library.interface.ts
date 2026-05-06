// ─────────────────────────────────────────────────────────────────────────────
// Library API — shared response contracts
// Base URL: https://library-api.adapterdigital.com/api
// ─────────────────────────────────────────────────────────────────────────────

// ─── Pagination ──────────────────────────────────────────────────────────────

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

// ─── Apps  GET /apps ───────────────────────────────────────────────────────────

export type LibraryAppCategory = "MCP" | "Platform" | "Tool" | string;

export type LibraryAppApiItem = {
    id: string;
    appId?: string;
    name: string;
    category: LibraryAppCategory;
    tags: AppTag[];
    description: string;
    imageId: string;
    iconId: string;
    instructions: string;
    ctaLabel: string | null;
    ctaLink: string | null;
    linkType: AppLinkType;
    isActive: boolean;
    sortOrder: number;
    badgeLabel: string | null;
    createdAt: string;
    updatedAt: string;
    imageUrl: string;
    iconUrl?: string;
};

export type LibraryAppsGroupItem = {
    group: string;
    items: LibraryAppApiItem[];
};

export type GetAppsParams = {
    page?: number;
    limit?: number;
    category?: LibraryAppCategory;
};

export type GetAppsResponse = Paginated<LibraryAppsGroupItem>;

// ─── Manage Apps  /manage/apps ───────────────────────────────────────────────

export type ManageApiEnvelope<T> = {
    success: boolean;
    message?: string;
    data: T;
    meta?: PaginationMeta;
};

export type ManageAppTagRef = string | { id?: string; tagId?: string; name?: string };

// Exact-ish shape for /api/manage/apps list payload (based on live response).
export type ManageAppApiItem = Omit<LibraryAppApiItem, "imageUrl"> & {
    userId?: string;
    imageUrl?: string;
};

export type ManageAppPayload = {
    name: string;
    category: LibraryAppCategory;
    description: string;
    imageId: string;
    iconId: string;
    instructions: string;
    ctaLabel: string;
    ctaLink: string;
    linkType: AppLinkType;
    isActive: boolean;
    sortOrder: number;
    badgeLabel: string;
    tags: string[];
};

export type ManageAppListResponse =
    | ManageApiEnvelope<ManageAppApiItem[]>
    | GetAppsResponse;

export type ManageAppMutationResponse = ManageApiEnvelope<ManageAppApiItem>;

// ─── Manage AI Models  /manage/ai ───────────────────────────────────────────

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

// ─── Banners  GET /banners ─────────────────────────────────────────────────────

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

/** linkType controls where the CTA navigates */
export type AppLinkType = "instruction" | "internal" | "external";

export type BannerAppItem = {
    id: string;
    appId?: string;
    name: string;
    category: LibraryAppCategory;
    tags: AppTag[];
    description: string;
    imageId: string;
    iconId: string;
    instructions: string;
    ctaLabel: string;
    ctaLink: string | null;
    linkType: AppLinkType;
    isActive: boolean;
    sortOrder: number;
    badgeLabel: string | null;
    createdAt: string;
    updatedAt: string;
    imageUrl: string;
    iconUrl: string;
};

export type LibraryBannerItem = {
    id?: string;
    bannerId: string;
    title: string;
    subtitle: string;
    imageId: string;
    appId?: string;
    app: BannerAppItem;
    sortOrder: number;
    isActive: boolean;
    startsAt: string;
    /** null = no expiry */
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
    imageUrl: string;
};

export type GetBannersParams = {
    page?: number;
    limit?: number;
};

export type GetBannersResponse = Paginated<LibraryBannerItem>;

export function getAppItemId(item: { id?: string; appId?: string }): string {
    return item.id ?? item.appId ?? "";
}
