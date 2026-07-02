import type { Paginated } from "./common.interface";
import type { CategoryInfo } from "./categories.interface";
import type { AppTag } from "./tags.interface";
import type { LibraryAppCategory, AppLinkType } from "./apps.interface";

export type BannerAppItem = {
    id: string;
    appId?: string;
    name: string;
    category: LibraryAppCategory | CategoryInfo;
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
    badgeLabel?: string | null;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    imageUrl: string;
    iconUrl?: string;
};

export type LibraryBannerItem = {
    id?: string;
    bannerId?: string;
    title: string;
    subtitle: string;
    imageId: string;
    appId?: string;
    app: BannerAppItem;
    sortOrder: number;
    isActive: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    imageUrl: string;
};

export type GetBannersParams = {
    page?: number;
    limit?: number;
};

export type GetBannersResponse = Paginated<LibraryBannerItem>;

export type ManageBannerPayload = {
    title: string;
    subtitle: string;
    imageId: string;
    appId: string;
    sortOrder: number;
    isActive: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
};
