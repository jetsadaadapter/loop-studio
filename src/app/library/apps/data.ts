import {
    getAppItemId,
    type GetAppsResponse,
    type LibraryAppApiItem,
} from "@/core/interfaces/library.interface";

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
// 2) Data schema for API-style response (id-first)
// ------------------------------------------------------------
// id: stable identifier used for routing and system references
export type LibraryApp = {
    id: string;
    name: string;
    category: string;
    status: string;
    badge?: string;
    iconBg: string;
    imageUrl?: string;
    iconUrl?: string;
};

export type LibrarySection = {
    id: string;
    title: string;
    items: LibraryApp[];
};

export type LibraryAppsResponse = {
    sections: LibrarySection[];
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

function toSectionLabel(value: string): string {
    const normalized = normalizeText(value, "Tool");
    return normalized.toUpperCase();
}

function normalizeText(value: unknown, fallback = ""): string {
    if (typeof value !== "string") return fallback;
    const normalized = value.trim();
    return normalized || fallback;
}

function stableHash(seed: string): number {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
    return hash;
}

export function getStableIconBg(seed: string): string {
    const safeSeed = normalizeText(seed, "app");
    const dayOfWeek = new Date().getDay(); // 0 (Sun) – 6 (Sat)
    const index = (stableHash(safeSeed) + dayOfWeek) % ICON_BG_PRESETS.length;
    return ICON_BG_PRESETS[index];
}

export function getAppStatus(app: LibraryAppApiItem): string {
    if (app.badgeLabel?.toLowerCase() === "new") return "New";
    return app.isActive ? "Production ready" : "Planned";
}

function mapApiApp(item: LibraryAppApiItem, sectionId: string): LibraryApp {
    const name = normalizeText(item.name, "Unknown app");
    const id = normalizeText(getAppItemId(item), `${sectionId}:${name.toLowerCase().replace(/\s+/g, "-")}`);

    return {
        id,
        name,
        category: normalizeText(item.category, "Tool"),
        status: getAppStatus(item),
        badge: item.badgeLabel ?? undefined,
        iconBg: getStableIconBg(id),
        imageUrl: item.imageUrl,
        iconUrl: item.iconUrl,
    };
}

export function mapAppsResponseToSections(response: GetAppsResponse): LibrarySection[] {
    console.log(`[LibraryApps] Mapping ${response.data.length} groups to sections`);

    const sections = response.data.map((groupBlock, groupIndex) => {
        const sectionId = normalizeText(groupBlock.group, "tool").toLowerCase();
        const itemCount = groupBlock.items?.length ?? 0;
        console.log(`[LibraryApps] Group ${groupIndex + 1}: "${groupBlock.group}" → ${itemCount} items`);

        return {
            id: sectionId,
            title: toSectionLabel(groupBlock.group),
            items: [...(groupBlock.items ?? [])]
                .sort((left, right) => left.sortOrder - right.sortOrder)
                .map((item) =>
                    mapApiApp(item, sectionId),
                ),
        };
    });

    const totalApps = sections.reduce((sum, s) => sum + s.items.length, 0);
    console.log(`[LibraryApps] ✓ Mapped to ${sections.length} sections with ${totalApps} total apps`);
    return sections;
}

export const libraryAppsResponse: LibraryAppsResponse = {
    sections: [],
};
