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
    th: "จัดการ",
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
    title: { th: "แดชบอร์ด", en: "Dashboard" },
    subtitle: {
        th: "ภาพรวมของพื้นที่ทำงานและเครื่องมือที่กำลังจะมา",
        en: "Overview of management workspaces and upcoming tools",
    },
    crumb: { th: "ภาพรวม", en: "Overview" },
};

export const MANAGE_DASHBOARD_FLAGS = {
    showComingSoon: true,
} as const;

export const MANAGE_NAV_ITEMS: Array<ManageRouteMeta> = [
    MANAGE_OVERVIEW_ROUTE,
    {
        href: "/manage/apps",
        title: { th: "แอป", en: "App" },
        subtitle: {
            th: "สร้างและจัดการรายการแอปในแคตตาล็อก",
            en: "Create and maintain app catalog entries",
        },
        crumb: { th: "แอป", en: "App" },
    },
    {
        href: "/manage/models",
        title: { th: "โมเดล AI", en: "AI Models" },
        subtitle: {
            th: "จัดการผู้ให้บริการโมเดล ค่าเริ่มต้น และการเปิดใช้งาน",
            en: "Manage model providers, defaults, and activation",
        },
        crumb: { th: "โมเดล", en: "Models" },
    },
];

export const MANAGE_FUTURE_NAV_ITEMS: Array<ManageFutureNavItem> = [
    { label: { th: "การตั้งค่าระบบ", en: "System Settings" } },
    { label: { th: "บันทึกการตรวจสอบ", en: "Audit Logs" } },
];

export function getManageRouteMeta(pathname: string): ManageRouteMeta {
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
): ManageBreadcrumbItem[] {
    const current = getManageRouteMeta(pathname);

    const extraPath = pathname.replace(current.href, "").split("/").filter(Boolean);
    const items: ManageBreadcrumbItem[] = [];

    if (current.href !== MANAGE_OVERVIEW_ROUTE.href) {
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
