// ------------------------------------------------------------
// 1) Domain keys used by tab/status controls on the store page
// ------------------------------------------------------------
export type MainTabKey = "mcp" | "platform" | "tool" | "marketplace-updates" | "admin";
export type StatusFilterKey =
    | "all"
    | "production ready"
    | "in rollout"
    | "beta"
    | "planned"
    | "new";

// ------------------------------------------------------------
// 2) Data schema for API-style response (id + slug)
// ------------------------------------------------------------
// id: stable identifier for systems/database relations
// slug: human-readable identifier for URLs or client-side routing
export type StoreApp = {
    id: string;
    slug: string;
    name: string;
    category: string;
    status: string;
    badge?: string;
    iconBg: string;
};

export type StoreSection = {
    id: string;
    title: string;
    items: StoreApp[];
};

export type StoreAppsResponse = {
    sections: StoreSection[];
};

// ------------------------------------------------------------
// 3) UI config data (tabs + status filter chips)
// ------------------------------------------------------------
// These arrays drive the top tab and status filter controls in page.tsx.
export const mainTabs: Array<{ key: MainTabKey; label: string }> = [
    { key: "mcp", label: "MCP" },
    { key: "platform", label: "Platform" },
    { key: "tool", label: "Tool" },
    { key: "marketplace-updates", label: "Marketplace Updates" },
    { key: "admin", label: "Admin" },
];

export const statusFilters: Array<{ key: StatusFilterKey; label: string }> = [
    { key: "all", label: "All" },
    { key: "production ready", label: "Production ready" },
    { key: "in rollout", label: "In rollout" },
    { key: "beta", label: "Beta" },
    { key: "planned", label: "Planned" },
    { key: "new", label: "New" },
];

// ------------------------------------------------------------
// 4) Mock response payload (same shape as real API response)
// ------------------------------------------------------------
// page.tsx consumes this as: storeAppsResponse.sections[].items[]
export const storeAppsResponse: StoreAppsResponse = {
    sections: [
        {
            id: "mcp",
            title: "MCP",
            items: [
                { id: "app_001", slug: "apify-mcp", name: "APIFY MCP", category: "Data Connector", status: "Production ready", iconBg: "bg-emerald-600" },
                { id: "app_002", slug: "adapter-media-mcp", name: "Adapter Media MCP", category: "Media Integration", status: "Production ready", iconBg: "bg-blue-600" },
                { id: "app_003", slug: "hype-mcp", name: "HYPE MCP", category: "Campaign Automation", status: "Planned", iconBg: "bg-slate-700" },
                { id: "app_004", slug: "audit-mcp", name: "Audit Stream MCP", category: "Observability", status: "Beta", iconBg: "bg-orange-600" },
                { id: "app_005", slug: "policy-mcp", name: "Policy Guard MCP", category: "Governance", status: "In rollout", iconBg: "bg-purple-700" },
                { id: "app_006", slug: "workflow-mcp", name: "Workflow Bridge MCP", category: "Automation", status: "In rollout", iconBg: "bg-pink-600" },
            ],
        },
        {
            id: "platform",
            title: "Platform",
            items: [
                { id: "app_007", slug: "adapter-campaign", name: "Adapter Campaign", category: "Campaign Platform", status: "Production ready", iconBg: "bg-emerald-700" },
                { id: "app_008", slug: "adapter-workflow-hub", name: "Workflow Hub", category: "Orchestration", status: "Beta", iconBg: "bg-indigo-700" },
                { id: "app_009", slug: "adapter-insight-center", name: "Insight Center", category: "Analytics", status: "Beta", iconBg: "bg-cyan-700" },
                { id: "app_010", slug: "adapter-identity", name: "Identity Access", category: "Security", status: "In rollout", iconBg: "bg-red-700" },
                { id: "app_011", slug: "adapter-admin-console", name: "Admin Console", category: "Operations", status: "In rollout", iconBg: "bg-teal-700" },
                { id: "app_012", slug: "adapter-billing", name: "Billing Core", category: "Finance", status: "Planned", iconBg: "bg-lime-700" },
            ],
        },
        {
            id: "tool",
            title: "Tool",
            items: [
                { id: "app_013", slug: "comment-loader", name: "Comment Loader", category: "Data Tool", status: "NEW", badge: "NEW", iconBg: "bg-emerald-700" },
                { id: "app_014", slug: "post-comment-analyzer", name: "Post Comment Analyzer", category: "Insight Tool", status: "NEW", badge: "NEW", iconBg: "bg-red-700" },
                { id: "app_015", slug: "keyword-clustering", name: "Keyword Clustering", category: "Analysis Tool", status: "Beta", iconBg: "bg-violet-700" },
                { id: "app_016", slug: "reply-assistant", name: "Reply Assistant", category: "Engagement Tool", status: "Beta", iconBg: "bg-amber-700" },
                { id: "app_017", slug: "sentiment-monitor", name: "Sentiment Monitor", category: "Monitoring Tool", status: "In rollout", iconBg: "bg-zinc-700" },
                { id: "app_018", slug: "campaign-qa", name: "Campaign QA", category: "Quality Tool", status: "Planned", iconBg: "bg-indigo-700" },
            ],
        },
    ],
};

// ------------------------------------------------------------
// 5) Static UI data for store footer links
// ------------------------------------------------------------
export const footerLinks = {
    Marketplace: ["MCP", "Platform", "Tool", "New Releases", "Top Charts"],
    Developers: ["Submit an App", "Developer Docs", "API Reference", "Changelog"],
    Company: ["About", "Blog", "Careers", "Privacy Policy", "Terms"],
};
