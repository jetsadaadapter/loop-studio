export type HeroTheme = "campaign" | "workflow" | "loader";

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
    theme: HeroTheme;                       // Visual theme: campaign, workflow, loader
    title: string;                          // Marketing headline for this featured story
    imageUrl: string;                       // Hero banner image URL
    toolTags: string[];                     // Feature highlights / capability tags

    // Navigation
    actionType: "internal" | "linkout";
    actionUrl: string;
};

export type HeroBannerResponse = {
    sectionId: string;
    sectionTitle: string;
    items: HeroSlide[];
};

export const heroBannerMock: HeroBannerResponse = {
    sectionId: "featured-hero",
    sectionTitle: "Featured app stories",
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
            theme: "campaign",
            title: "Run campaigns at scale with multi-channel orchestration",
            imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1296&h=728&fit=crop",
            toolTags: ["Multi-Channel", "Orchestration", "Analytics"],
            actionType: "internal",
            actionUrl: "/store/apps/adapter-campaign",
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
            theme: "workflow",
            title: "Automate complex workflows with visual builder",
            imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1296&h=728&fit=crop",
            toolTags: ["Visual Builder", "Automation", "Integration"],
            actionType: "internal",
            actionUrl: "/store/apps/adapter-workflow-hub",
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
            theme: "loader",
            title: "Load and analyze comments from any platform",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1296&auto=format&fit=crop",
            toolTags: ["Data Import", "Comment Analysis", "Platform Support"],
            actionType: "internal",
            actionUrl: "/store/apps/comment-loader",
        },
    ],
};
