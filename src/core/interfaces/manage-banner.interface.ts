// Banner interface for manage banners
export interface BannerManageItem {
    id: string;
    title: string;
    subtitle: string;
    imageId: string;
    app: {
        id: string;
        name: string;
        category: { id: string; name: string } | string;
        categoryId: string;
        tags: { id: string; name: string }[];
        description: string;
        coverId: string;
        imageId: string;
        iconId: string;
        instructions: string;
        ctaLabel: string;
        ctaLink: string;
        linkType: string;
        isActive: boolean;
        sortOrder: number;
        badgeLabel: string;
        userId: string;
        createdAt: string;
        updatedAt: string;
    };
    sortOrder: number;
    isActive: boolean;
    startsAt: string | null;
    endsAt: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
}
