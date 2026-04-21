// ─────────────────────────────────────────────────────────────────────────────
// Store API — shared response contracts
// Base URL: https://store-api.adapterdigital.com/api
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

// ─── Apps  GET /store/apps ───────────────────────────────────────────────────

export type StoreAppCategory = "MCP" | "Platform" | "Tool" | string;

export type StoreAppApiItem = {
    appId: string;
    name: string;
    category: StoreAppCategory;
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

export type StoreAppsGroupItem = {
    group: string;
    items: StoreAppApiItem[];
};

export type GetAppsParams = {
    page?: number;
    limit?: number;
    category?: StoreAppCategory;
};

export type GetAppsResponse = Paginated<StoreAppsGroupItem>;

// ─── Banners  GET /store/banners ─────────────────────────────────────────────

// ─── Banners  GET /store/banners ─────────────────────────────────────────────

export type AppTag = {
    tagId: string;
    name: string;
    /** Hex colour string e.g. "#0F6E56" */
    color: string;
    createdAt: string;
};

/** linkType controls where the CTA navigates */
export type AppLinkType = "instruction" | "internal" | "external";

export type BannerAppItem = {
    appId: string;
    name: string;
    category: StoreAppCategory;
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

export type StoreBannerItem = {
    bannerId: string;
    title: string;
    subtitle: string;
    imageId: string;
    appId: string;
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

export type GetBannersResponse = Paginated<StoreBannerItem>;
