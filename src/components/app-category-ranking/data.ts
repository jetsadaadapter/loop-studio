export type CategoryKey = "mcp" | "platform" | "tool";

export type RankedApp = {
  id: string;
  rank: number;
  name: string;
  category: string;
  meta: string;
  imageUrl: string;
  actionType?: "instruction" | "internal" | "linkout";
  actionUrl?: string;
};

export const categoryTabs: Array<{
  key: CategoryKey;
  label: string;
  description: string;
}> = [
    { key: "mcp", label: "MCP", description: "Model Context Protocol services" },
    { key: "platform", label: "Platform", description: "Core platform systems" },
    {
      key: "tool",
      label: "Tool",
      description: "Operational tools and utilities",
    },
  ];

export const DEFAULT_APP_IMAGE = "/images/logo/logo-app-1200x1200.svg";

export const APP_IMAGE_BY_ID: Record<string, string> = {
  "adapter-campaign": "/images/apps/adapter-campaign.png",
  "adapter-workflow-hub": "/images/apps/workflow-hub.svg",
  "comment-loader": "/images/apps/comment-loader.png",
  "post-comment-analyzer": "/images/apps/comment-loader.svg",
};

export const FALLBACK_RANKING_DATA: Record<CategoryKey, RankedApp[]> = {
  mcp: [
    {
      id: "apify-mcp",
      rank: 1,
      name: "APIFY MCP",
      category: "Data Connector",
      meta: "Production ready",
      imageUrl: "",
    },
    {
      id: "adapter-media-mcp",
      rank: 2,
      name: "Adapter Media MCP",
      category: "Media Integration",
      meta: "Production ready",
      imageUrl: "",
    },
    {
      id: "hype-mcp",
      rank: 3,
      name: "HYPE MCP",
      category: "Campaign Automation",
      meta: "Planned",
      imageUrl: "",
    },
    {
      id: "audit-mcp",
      rank: 4,
      name: "Audit Stream MCP",
      category: "Observability",
      meta: "Beta",
      imageUrl: "",
    },
    {
      id: "policy-mcp",
      rank: 5,
      name: "Policy Guard MCP",
      category: "Governance",
      meta: "In rollout",
      imageUrl: "",
    },
    {
      id: "workflow-mcp",
      rank: 6,
      name: "Workflow Bridge MCP",
      category: "Automation",
      meta: "In rollout",
      imageUrl: "",
    },
  ],
  platform: [
    {
      id: "adapter-campaign",
      rank: 1,
      name: "Adapter Campaign",
      category: "Campaign Platform",
      meta: "Production ready",
      imageUrl: "",
    },
    {
      id: "adapter-workflow-hub",
      rank: 2,
      name: "Workflow Hub",
      category: "Orchestration",
      meta: "Beta",
      imageUrl: "",
    },
    {
      id: "adapter-insight-center",
      rank: 3,
      name: "Insight Center",
      category: "Analytics",
      meta: "Beta",
      imageUrl: "",
    },
    {
      id: "adapter-identity",
      rank: 4,
      name: "Identity Access",
      category: "Security",
      meta: "In rollout",
      imageUrl: "",
    },
    {
      id: "adapter-admin-console",
      rank: 5,
      name: "Admin Console",
      category: "Operations",
      meta: "In rollout",
      imageUrl: "",
    },
    {
      id: "adapter-billing",
      rank: 6,
      name: "Billing Core",
      category: "Finance",
      meta: "Planned",
      imageUrl: "",
    },
  ],
  tool: [
    {
      id: "comment-loader",
      rank: 1,
      name: "Comment Loader",
      category: "Data Tool",
      meta: "NEW",
      imageUrl: "",
    },
    {
      id: "post-comment-analyzer",
      rank: 2,
      name: "Post Comment Analyzer",
      category: "Insight Tool",
      meta: "NEW",
      imageUrl: "",
    },
    {
      id: "keyword-clustering",
      rank: 3,
      name: "Keyword Clustering",
      category: "Analysis Tool",
      meta: "Beta",
      imageUrl: "",
    },
    {
      id: "reply-assistant",
      rank: 4,
      name: "Reply Assistant",
      category: "Engagement Tool",
      meta: "Beta",
      imageUrl: "",
    },
    {
      id: "sentiment-monitor",
      rank: 5,
      name: "Sentiment Monitor",
      category: "Monitoring Tool",
      meta: "In rollout",
      imageUrl: "",
    },
    {
      id: "campaign-qa",
      rank: 6,
      name: "Campaign QA",
      category: "Quality Tool",
      meta: "Planned",
      imageUrl: "",
    },
  ],
};
