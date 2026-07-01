import { type ManageMenuItem } from "@/core/interfaces/menus.interface";

type Locale = "th" | "en";

const DEFAULT_LOCALE: Locale = "th";

type LocalizedText = {
    th: string;
    en: string;
};

type ManageRouteMeta = {
    href: string;
    title: LocalizedText;
    subtitle: LocalizedText;
    crumb: LocalizedText;
};

type ManageBreadcrumbItem = {
    label: string;
    href?: string;
};

type ManageFutureNavItem = {
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
    showComingSoon: false,
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
    {
        href: "/manage/banners",
        title: { th: "Banner Library", en: "Banner Library" },
        subtitle: {
            th: "Manage banners and promotions",
            en: "Manage banners and promotions",
        },
        crumb: { th: "Banners", en: "Banners" },
    },
    {
        href: "/manage/tools",
        title: { th: "Tools", en: "Tools" },
        subtitle: {
            th: "Manage AI tools, params, and script pipelines",
            en: "Manage AI tools, params, and script pipelines",
        },
        crumb: { th: "Tools", en: "Tools" },
    },
    {
        href: "/manage/tags",
        title: { th: "Tags", en: "Tags" },
        subtitle: {
            th: "Manage tags for apps and content",
            en: "Manage tags for apps and content",
        },
        crumb: { th: "Tags", en: "Tags" },
    },
    {
        href: "/manage/categories",
        title: { th: "Categories", en: "Categories" },
        subtitle: {
            th: "Manage categories for apps and content",
            en: "Manage categories for apps and content",
        },
        crumb: { th: "Categories", en: "Categories" },
    },
    {
        href: "/manage/users",
        title: { th: "Users", en: "Users" },
        subtitle: {
            th: "Manage user profiles, roles, and departments",
            en: "Manage user profiles, roles, and departments",
        },
        crumb: { th: "Users", en: "Users" },
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
