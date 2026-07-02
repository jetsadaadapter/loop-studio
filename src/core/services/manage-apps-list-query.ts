import type { AppLinkType } from "@/core/interfaces/apps.interface";

export const DEFAULT_PAGE_SIZE = 12;
export const SORT_OPTIONS = ["newest", "name-asc", "name-desc", "sort-asc"] as const;

export type SortValue = (typeof SORT_OPTIONS)[number];
export type StatusFilterValue = "all" | "active" | "inactive";
export type TypeFilterValue = "all" | AppLinkType;

type ManageAppsListQueryState = {
    q: string;
    category: string;
    status: StatusFilterValue;
    type: TypeFilterValue;
    sort: SortValue;
    size: number;
    page: number;
};

type QueryReader = {
    get: (key: string) => string | null;
};

function isSortValue(value: string): value is SortValue {
    return (SORT_OPTIONS as readonly string[]).includes(value);
}

function isStatusValue(value: string): value is StatusFilterValue {
    return value === "all" || value === "active" || value === "inactive";
}

function isTypeValue(value: string): value is TypeFilterValue {
    return (
        value === "all" ||
        value === "instruction" ||
        value === "internal" ||
        value === "external"
    );
}



export function parseManageAppsListQuery(params: QueryReader): ManageAppsListQueryState {
    const q = params.get("q") ?? "";
    const category = params.get("category") ?? "all";

    const statusRaw = params.get("status") ?? "all";
    const status = isStatusValue(statusRaw) ? statusRaw : "all";

    const typeRaw = params.get("type") ?? "all";
    const type = isTypeValue(typeRaw) ? typeRaw : "all";

    const sortRaw = params.get("sort") ?? "sort-asc";
    const sort = isSortValue(sortRaw) ? sortRaw : "sort-asc";

    const sizeRaw = Number(params.get("size") ?? params.get("limit") ?? DEFAULT_PAGE_SIZE);
    const size = Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : DEFAULT_PAGE_SIZE;

    const pageRaw = Number(params.get("page") ?? 1);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    return {
        q,
        category,
        status,
        type,
        sort,
        size,
        page,
    };
}

export function applyManageAppsListQuery(
    params: URLSearchParams,
    state: ManageAppsListQueryState,
): URLSearchParams {
    const next = new URLSearchParams(params.toString());

    next.delete("q");
    next.delete("category");
    next.delete("status");
    next.delete("type");
    next.delete("sort");
    next.delete("size");
    next.delete("limit");
    next.delete("page");

    if (state.q.trim()) next.set("q", state.q.trim());
    if (state.category !== "all") next.set("category", state.category);
    if (state.status !== "all") next.set("status", state.status);
    if (state.type !== "all") next.set("type", state.type);
    if (state.sort !== "sort-asc") next.set("sort", state.sort);
    if (state.size !== DEFAULT_PAGE_SIZE) next.set("limit", String(state.size));
    if (state.page > 1) next.set("page", String(state.page));

    return next;
}
