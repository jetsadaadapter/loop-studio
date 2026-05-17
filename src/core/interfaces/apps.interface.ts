import type { Paginated, ManageApiEnvelope } from "./common.interface";
import type { CategoryInfo } from "./categories.interface";
import type { AppTag } from "./tags.interface";
import type { AppTool } from "./tools.interface";

export type LibraryAppCategory = CategoryInfo | string;

export type AppLinkType = "instruction" | "internal" | "external" | "tool";

export type LibraryAppApiItem = {
    id: string;
    appId?: string;
    name: string;
    category: LibraryAppCategory;
    categoryId?: string;
    tags: AppTag[];
    description: string;
    coverId?: string;
    imageId: string;
    iconId: string;
    instructions: string;
    ctaLabel: string | null;
    ctaLink: string | null;
    linkType: AppLinkType;
    isActive: boolean;
    sortOrder: number;
    badgeLabel: string | null;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    imageUrl: string;
    iconUrl?: string;
    appTool?: AppTool;
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

export type ManageAppTagRef = string | { id?: string; tagId?: string; name?: string };

export type ManageAppApiItem = Omit<LibraryAppApiItem, "imageUrl"> & {
    userId?: string;
    imageUrl?: string;
    categoryId?: string;
};

export type ManageAppPayload = {
    name: string;
    categoryId: string;
    description: string;
    imageId: string;
    iconId: string;
    coverId?: string;
    imageRemove?: {
        imageId?: string;
        iconId?: string;
        coverId?: string;
    };
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

export function getAppItemId(item: { id?: string; appId?: string }): string {
    return item.id ?? item.appId ?? "";
}
