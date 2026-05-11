import { type ManageMenuItem } from "@/core/interfaces/library.interface";

export type Locale = "th" | "en";

export const DEFAULT_LOCALE: Locale = "th";

export type LocalizedText = {
    th: string;
    en: string;
};

export type ManageRouteMeta = {
    href: string;
    title: LocalizedText;
    subtitle: LocalizedText;
    crumb: LocalizedText;
};

export type ManageBreadcrumbItem = {
    label: string;
    href?: string;
};

export type ManageFutureNavItem = {
    label: LocalizedText;
};

export const MANAGE_PARENT_CRUMB: LocalizedText = {
    th: "Manage",
    en: "Manage",
};

export function getLocalizedText(
    text: LocalizedText,
    locale: Locale = DEFAULT_LOCALE,
): string {
    return text[locale];
}

export const MANAGE_OVERVIEW_ROUTE: ManageRouteMeta = {
    href: "/manage",
    title: { th: "Overview", en: "Overview" },
    subtitle: {
        th: "Overview of management and upcoming tools",
        en: "Overview of management and upcoming tools",
    },
    crumb: { th: "Overview", en: "Overview" },
};

export const MANAGE_DASHBOARD_FLAGS = {
    showComingSoon: true,
} as const;

export const MANAGE_NAV_ITEMS: Array<ManageRouteMeta> = [
    MANAGE_OVERVIEW_ROUTE,
    {
        href: "/manage/apps",
        title: { th: "App", en: "App" },
        subtitle: {
            th: "Create and maintain app catalog entries",
            en: "Create and maintain app catalog entries",
        },
        crumb: { th: "App", en: "App" },
    },
    {
        href: "/manage/models",
        title: { th: "AI Models", en: "AI Models" },
        subtitle: {
            th: "Manage model providers, defaults, and activation",
            en: "Manage model providers, defaults, and activation",
        },
        crumb: { th: "Models", en: "Models" },
    },
];

export const MANAGE_FUTURE_NAV_ITEMS: Array<ManageFutureNavItem> = [
    { label: { th: "Settings", en: "Settings" } }
];

export function getManageRouteMeta(
    pathname: string,
    menus?: ManageMenuItem[],
): ManageRouteMeta {
    if (menus) {
        // Sort menus by path length descending to match deepest first
        const sortedMenus = [...menus].sort((a, b) => b.path.length - a.path.length);
        const match = sortedMenus.find(
            (m) => pathname === m.path || pathname.startsWith(`${m.path}/`),
        );

        if (match) {
            return {
                href: match.path,
                title: { th: match.name, en: match.name },
                subtitle: { th: "", en: "" },
                crumb: { th: match.name, en: match.name },
            };
        }
    }

    const sortedItems = [...MANAGE_NAV_ITEMS].sort(
        (left, right) => right.href.length - left.href.length,
    );

    return (
        sortedItems.find(
            (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
        ) ?? MANAGE_OVERVIEW_ROUTE
    );
}

export function getManageBreadcrumbItems(
    pathname: string,
    locale: Locale = DEFAULT_LOCALE,
    menus?: ManageMenuItem[],
): ManageBreadcrumbItem[] {
    const current = getManageRouteMeta(pathname, menus);

    const extraPath = pathname.replace(current.href, "").split("/").filter(Boolean);
    const items: ManageBreadcrumbItem[] = [];

    if (current.href !== MANAGE_OVERVIEW_ROUTE.href && current.href !== "/") {
        items.push({
            label: getLocalizedText(MANAGE_PARENT_CRUMB, locale),
            href: MANAGE_OVERVIEW_ROUTE.href,
        });
    }

    items.push({
        label: getLocalizedText(current.crumb, locale),
        href: extraPath.length > 0 ? current.href : undefined,
    });

    for (const segment of extraPath) {
        const label = decodeURIComponent(segment)
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        items.push({ label });
    }

    return items;
}
