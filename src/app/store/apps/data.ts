export type MainTabKey = "mcp" | "platform" | "tool" | "marketplace-updates" | "admin";
export type StatusFilterKey =
    | "all"
    | "production ready"
    | "in rollout"
    | "beta"
    | "planned"
    | "new";

export type StoreApp = {
    id: string;
    name: string;
    category: string;
    rating: string;
    badge?: string;
    iconBg: string;
};

export type AppSection = {
    id: string;
    title: string;
    apps: StoreApp[];
};

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

export const appSections: AppSection[] = [
    {
        id: "mcp",
        title: "MCP",
        apps: [
            { id: "apify-mcp", name: "APIFY MCP", category: "Data Connector", rating: "Production ready", iconBg: "bg-emerald-600" },
            { id: "adapter-media-mcp", name: "Adapter Media MCP", category: "Media Integration", rating: "Production ready", iconBg: "bg-blue-600" },
            { id: "hype-mcp", name: "HYPE MCP", category: "Campaign Automation", rating: "Planned", iconBg: "bg-slate-700" },
            { id: "audit-mcp", name: "Audit Stream MCP", category: "Observability", rating: "Beta", iconBg: "bg-orange-600" },
            { id: "policy-mcp", name: "Policy Guard MCP", category: "Governance", rating: "In rollout", iconBg: "bg-purple-700" },
            { id: "workflow-mcp", name: "Workflow Bridge MCP", category: "Automation", rating: "In rollout", iconBg: "bg-pink-600" },
        ],
    },
    {
        id: "platform",
        title: "Platform",
        apps: [
            { id: "adapter-campaign", name: "Adapter Campaign", category: "Campaign Platform", rating: "Production ready", iconBg: "bg-emerald-700" },
            { id: "adapter-workflow-hub", name: "Workflow Hub", category: "Orchestration", rating: "Beta", iconBg: "bg-indigo-700" },
            { id: "adapter-insight-center", name: "Insight Center", category: "Analytics", rating: "Beta", iconBg: "bg-cyan-700" },
            { id: "adapter-identity", name: "Identity Access", category: "Security", rating: "In rollout", iconBg: "bg-red-700" },
            { id: "adapter-admin-console", name: "Admin Console", category: "Operations", rating: "In rollout", iconBg: "bg-teal-700" },
            { id: "adapter-billing", name: "Billing Core", category: "Finance", rating: "Planned", iconBg: "bg-lime-700" },
        ],
    },
    {
        id: "tool",
        title: "Tool",
        apps: [
            { id: "comment-loader", name: "Comment Loader", category: "Data Tool", rating: "NEW", badge: "NEW", iconBg: "bg-emerald-700" },
            { id: "post-comment-analyzer", name: "Post Comment Analyzer", category: "Insight Tool", rating: "NEW", badge: "NEW", iconBg: "bg-red-700" },
            { id: "keyword-clustering", name: "Keyword Clustering", category: "Analysis Tool", rating: "Beta", iconBg: "bg-violet-700" },
            { id: "reply-assistant", name: "Reply Assistant", category: "Engagement Tool", rating: "Beta", iconBg: "bg-amber-700" },
            { id: "sentiment-monitor", name: "Sentiment Monitor", category: "Monitoring Tool", rating: "In rollout", iconBg: "bg-zinc-700" },
            { id: "campaign-qa", name: "Campaign QA", category: "Quality Tool", rating: "Planned", iconBg: "bg-indigo-700" },
        ],
    },
];

const STATUS_BADGE: Record<string, string> = {
    "new": "bg-red-100 text-red-700",
    "production ready": "bg-emerald-100 text-emerald-700",
    "in rollout": "bg-amber-100 text-amber-800",
    "beta": "bg-sky-100 text-sky-800",
};

export function statusBadgeClass(status: string): string {
    return STATUS_BADGE[status.toLowerCase()] ?? "bg-slate-100 text-slate-700";
}

export const footerLinks = {
    Marketplace: ["MCP", "Platform", "Tool", "New Releases", "Top Charts"],
    Developers: ["Submit an App", "Developer Docs", "API Reference", "Changelog"],
    Company: ["About", "Blog", "Careers", "Privacy Policy", "Terms"],
};
