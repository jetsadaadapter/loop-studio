import type { StoreBannerItem } from "@/core/interfaces/store.interface";

export type HeroMood = "cool" | "warm" | "neutral" | "premium";

export type HeroTheme =
    | "teal"
    | "emerald"
    | "sky"
    | "indigo"
    | "cyan"
    | "amber"
    | "orange"
    | "rose"
    | "stone"
    | "violet"
    | "fuchsia"
    | "slate"
    | "zinc";

const HERO_THEME_PRESETS_BY_MOOD: Record<HeroMood, HeroTheme[]> = {
    cool: ["teal", "cyan", "sky"],
    warm: ["amber", "orange", "rose"],
    neutral: ["slate", "stone", "zinc"],
    premium: ["indigo", "violet", "fuchsia"],
};

/**
 * HeroSlide: Featured app story
 * 
 * References a selected app from storeAppsResponse and enriches it with:
 * - Marketing narrative (title, imageUrl, toolTags)
 * - Visual theme for hero card styling
 * - Navigation action (internal detail page or external)
 * 
 * The app reference (appId, appSlug, appName, category, status) comes from storeAppsResponse.
 * Hero-specific enrichment (title, imageUrl, theme, toolTags) is curated separately.
 */
export type HeroSlide = {
    // App reference (from storeAppsResponse)
    appId: string;                          // e.g., "app_007"
    appSlug: string;                        // e.g., "adapter-campaign"
    appName: string;                        // e.g., "Adapter Campaign"
    appIconUrl?: string;
    category: string;                       // e.g., "Campaign Platform" (inherited from app)
    status: string;                         // e.g., "Production ready", "Beta", "NEW"
    badge?: string;                         // e.g., "NEW"

    // Hero-specific enrichment & curation
    heroId: string;                         // Unique hero story ID (e.g., "hero_001")
    heroSlug: string;                       // Hero story slug for URL (e.g., "adapter-campaign-spring-update")
    theme: HeroTheme;                       // Visual preset used for hero card styling
    title: string;                          // Marketing headline for this featured story
    imageUrl: string;                       // Hero banner image URL
    toolTags: string[];                     // Feature highlights / capability tags

    // Navigation
    actionType: "instruction" | "internal" | "linkout";
    ctaLabel: string;
    actionUrl: string;
};

export type HeroBannerResponse = {
    sectionId: string;
    sectionTitle: string;
    items: HeroSlide[];
};

function getStableHash(seed: string): number {
    let hash = 0;

    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }

    return hash;
}

function getMoodFromBanner(item: StoreBannerItem): HeroMood {
    const category = item.app.category.toLowerCase();
    const tags = item.app.tags.map((tag) => tag.name.toLowerCase());

    if (
        category.includes("platform") ||
        tags.some((tag) => ["marketing", "email", "campaign"].includes(tag))
    ) {
        return "premium";
    }

    if (
        category.includes("tool") ||
        tags.some((tag) => ["scraping", "crawling", "automation", "data"].includes(tag))
    ) {
        return "warm";
    }

    if (
        category.includes("security") ||
        category.includes("operations") ||
        category.includes("governance")
    ) {
        return "neutral";
    }

    return "cool";
}

function getStableThemePreset(seed: string, mood: HeroMood): HeroTheme {
    const presets = HERO_THEME_PRESETS_BY_MOOD[mood];
    const hash = getStableHash(seed);

    return presets[hash % presets.length];
}

export function mapBannerTheme(item: StoreBannerItem): HeroTheme {
    const mood = getMoodFromBanner(item);

    return getStableThemePreset(
        `${item.bannerId}:${item.appId}:${item.app.category}`,
        mood,
    );
}

function slugifyAppName(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizeInternalPath(path: string): string {
    if (path.startsWith("/apps/")) return path;
    if (path.startsWith("/library/apps/")) {
        return path.replace(/^\/library/, "");
    }
    if (path.startsWith("/")) return path;
    return `/apps/${path}`;
}

export function mapBannerToHeroSlide(item: StoreBannerItem): HeroSlide {
    const derivedSlug = item.app.ctaLink?.startsWith("/apps/")
        ? item.app.ctaLink.replace(/^\/apps\//, "")
        : slugifyAppName(item.app.name);

    const actionType =
        item.app.linkType === "external"
            ? "linkout"
            : item.app.linkType === "instruction"
                ? "instruction"
                : "internal";

    const actionUrl =
        actionType === "linkout"
            ? item.app.ctaLink ?? "https://library-api.adapterdigital.com"
            : actionType === "instruction"
                ? `/apps/${derivedSlug}`
                : item.app.ctaLink
                    ? normalizeInternalPath(item.app.ctaLink)
                    : `/apps/${derivedSlug}`;

    return {
        appId: item.appId,
        appSlug: derivedSlug,
        appName: item.app.name,
        appIconUrl: item.app.iconUrl,
        category: item.app.category,
        status: item.app.isActive ? "Active" : "Inactive",
        badge: item.app.badgeLabel ?? undefined,
        heroId: item.bannerId,
        heroSlug: item.bannerId,
        theme: mapBannerTheme(item),
        title: item.title,
        imageUrl: item.imageUrl,
        toolTags: item.app.tags.map((tag) => tag.name),
        actionType,
        ctaLabel: item.app.ctaLabel,
        actionUrl,
    };
}

export const heroBannerMock: HeroBannerResponse = {
    sectionId: "featured-hero",
    sectionTitle: "Featured Library stories",
    items: [
        {
            // Reference: Adapter Campaign (app_007) from Platform section
            appId: "app_007",
            appSlug: "adapter-campaign",
            appName: "Adapter Campaign",
            appIconUrl: "/images/apps/adapter-campaign.png",
            category: "Campaign Platform",
            status: "Production ready",

            // Hero enrichment
            heroId: "hero_001",
            heroSlug: "adapter-campaign-spring-update",
            theme: "indigo",
            title: "Run campaigns at scale with multi-channel orchestration",
            imageUrl: "/images/mock/hero/campaign.png",
            toolTags: ["Multi-Channel", "Orchestration", "Analytics"],
            ctaLabel: "Open app",
            actionType: "internal",
            actionUrl: "/apps/adapter-campaign",
        },
        {
            // Reference: Workflow Hub (app_008) from Platform section
            appId: "app_008",
            appSlug: "adapter-workflow-hub",
            appName: "Workflow Hub",
            category: "Orchestration",
            status: "Beta",

            // Hero enrichment
            heroId: "hero_002",
            heroSlug: "workflow-hub-automation-engine",
            theme: "sky",
            title: "Automate complex workflows with visual builder",
            imageUrl: "/images/mock/hero/workflow.png",
            toolTags: ["Visual Builder", "Automation", "Integration"],
            ctaLabel: "View detail",
            actionType: "internal",
            actionUrl: "/apps/adapter-workflow-hub",
        },
        {
            // Reference: Comment Loader (app_013) from Tool section
            appId: "app_013",
            appSlug: "comment-loader",
            appName: "Comment Loader",
            appIconUrl: "/images/apps/comment-loader.png",
            category: "Data Tool",
            status: "NEW",
            badge: "NEW",

            // Hero enrichment
            heroId: "hero_003",
            heroSlug: "comment-loader-engagement-engine",
            theme: "orange",
            title: "Load and analyze comments from any platform",
            imageUrl: "/images/mock/hero/data.png",
            toolTags: ["Data Import", "Comment Analysis", "Platform Support"],
            ctaLabel: "View detail",
            actionType: "internal",
            actionUrl: "/apps/comment-loader",
        },
    ],
};
