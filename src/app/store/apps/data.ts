import type { GetAppsResponse, StoreAppApiItem } from "@/core/interfaces/store.interface";

// ------------------------------------------------------------
// 1) Domain keys used by tab/status controls on the store page
// ------------------------------------------------------------
export type MainTabKey = "mcp" | "platform" | "tool";
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
    iconUrl?: string;
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
];

export const statusFilters: Array<{ key: StatusFilterKey; label: string }> = [
    { key: "all", label: "All" },
    { key: "production ready", label: "Production ready" },
    { key: "in rollout", label: "In rollout" },
    { key: "beta", label: "Beta" },
    { key: "planned", label: "Planned" },
    { key: "new", label: "New" },
];

const ICON_BG_PRESETS = [
    "bg-emerald-700",
    "bg-blue-700",
    "bg-indigo-700",
    "bg-violet-700",
    "bg-cyan-700",
    "bg-amber-700",
    "bg-rose-700",
    "bg-teal-700",
    "bg-slate-700",
] as const;

function toTitleCase(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function slugifyAppName(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function stableHash(seed: string): number {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
    return hash;
}

export function getStableIconBg(seed: string): string {
    return ICON_BG_PRESETS[stableHash(seed) % ICON_BG_PRESETS.length];
}

export function getAppStatus(app: StoreAppApiItem): string {
    if (app.badgeLabel?.toLowerCase() === "new") return "New";
    return app.isActive ? "Production ready" : "Planned";
}

function mapApiApp(item: StoreAppApiItem): StoreApp {
    return {
        id: item.appId,
        slug: slugifyAppName(item.name),
        name: item.name,
        category: item.category,
        status: getAppStatus(item),
        badge: item.badgeLabel ?? undefined,
        iconBg: getStableIconBg(item.appId),
        iconUrl: item.iconUrl,
    };
}

export function mapAppsResponseToSections(response: GetAppsResponse): StoreSection[] {
    return response.data.map((groupBlock) => ({
        id: groupBlock.group.toLowerCase(),
        title: toTitleCase(groupBlock.group),
        items: [...groupBlock.items]
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map(mapApiApp),
    }));
}

export const storeAppsResponse: StoreAppsResponse = {
    sections: [],
};
