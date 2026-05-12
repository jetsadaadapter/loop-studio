import type {
    UserProfile,
    UserProfileResponse,
} from "@/core/interfaces/auth.interface";
import type {
    GetAppsParams,
    GetAppsResponse,
    GetBannersParams,
    GetBannersResponse,
    LibraryAppApiItem,
    ManageAppApiItem,
    ManageAiListResponse,
    ManageAiApiListItem,
    ManageAiModelApiItem,
    ManageAiModelPayload,
    ManageAiMutationResponse,
    ManageAppListResponse,
    ManageAppMutationResponse,
    ManageAppPayload,
    PaginationMeta,
    ManageMenuItem,
    ManageMenuResponse,
    ManageTagApiItem,
    ManageTagListResponse,
} from "@/core/interfaces/library.interface";
import { getAppItemId as resolveAppId } from "@/core/interfaces/library.interface";

// ─────────────────────────────────────────────────────────────────────────────
// Library API service
// Base URL: https://library-api.adapterdigital.com/api
//
// All functions are thin fetch wrappers — no caching strategy is assumed here.
// Callers control revalidation via Next.js fetch options or SWR/React Query.
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public url: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// On the server, prefer SERVER_API_BASE_URL (internal network).
// On the client, route through same-origin proxy to avoid browser CORS/preflight issues.
const BASE_URL =
    typeof window === "undefined"
        ? process.env.SERVER_API_BASE_URL || process.env.NEXT_PUBLIC_STORE_API_BASE_URL
        : "/api/library";

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_STORE_API_BASE_URL");
}

const TOKEN_COOKIE_KEY = "zt_token";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build URL with type-safe query params.
 * Omits undefined values so the server never receives empty strings.
 */
function buildUrl(
    path: string,
    params?: Record<string, string | number | undefined>,
): string {
    const target = `${BASE_URL}${path}`;
    const isAbsolute = /^https?:\/\//i.test(target);
    const url = isAbsolute
        ? new URL(target)
        : new URL(target, "http://local");

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
    }

    if (isAbsolute) {
        return url.toString();
    }

    return `${url.pathname}${url.search}`;
}

function readBrowserCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const all = document.cookie ? document.cookie.split(";") : [];
    const prefix = `${name}=`;

    for (const raw of all) {
        const cookie = raw.trim();
        if (cookie.startsWith(prefix)) {
            return decodeURIComponent(cookie.slice(prefix.length));
        }
    }

    return null;
}

async function getAuthToken(): Promise<string | null> {
    // Client requests go through /api/library proxy which injects bearer on the server.
    if (typeof window !== "undefined" && BASE_URL?.startsWith("/api/library")) {
        return null;
    }

    if (typeof window !== "undefined") {
        const token = readBrowserCookie(TOKEN_COOKIE_KEY);
        console.log(`[Library API] Browser token: ${token ? "✓ Found" : "✗ Missing"}`);
        return token;
    }

    try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get(TOKEN_COOKIE_KEY)?.value || null;
        console.log(`[Library API] Server token: ${token ? "✓ Found" : "✗ Missing"}`);
        return token;
    } catch (err) {
        console.error("[Library API] Failed to read auth token:", err);
        return null;
    }
}

/**
 * Shared fetch wrapper — throws a typed Error on non-2xx responses
 * so callers can catch and surface meaningful messages.
 */
async function apiFetch<T>(
    url: string,
    init?: RequestInit,
): Promise<T> {
    const incomingHeaders = new Headers(init?.headers);

    if (!incomingHeaders.has("Authorization")) {
        const token = await getAuthToken();
        if (token) {
            incomingHeaders.set("Authorization", `Bearer ${token}`);
        }
    }

    if (!incomingHeaders.has("Content-Type")) {
        incomingHeaders.set("Content-Type", "application/json");
    }

    const hasAuth = incomingHeaders.has("Authorization");
    console.log(`[Library API] → ${init?.method ?? "GET"} ${url}`);
    console.log(`[Library API]   Authorization: ${hasAuth ? "Bearer <token>" : "⚠ MISSING"}`);

    const t0 = Date.now();
    let res: Response;
    try {
        res = await fetch(url, {
            headers: incomingHeaders,
            credentials: "include",
            ...init,
        });
    } catch (error) {
        const err = error as Error & {
            cause?: { code?: string; errno?: number; syscall?: string; address?: string; port?: number };
        };

        console.error("[Library API] ✗ Network fetch failed", {
            url,
            method: init?.method ?? "GET",
            hasAuth,
            message: err.message,
            cause: err.cause,
        });
        throw error;
    }
    console.log(`[Library API] ← ${res.status} ${res.statusText} (${Date.now() - t0}ms)`);

    if (res.status === 401) {
        // Token expired or revoked — bounce to login (client-side only).
        // Server-side errors will throw and be caught by the page/component to redirect to /api/auth/logout
        if (typeof window !== "undefined") {
            window.location.href = "/api/auth/logout";
        }
        throw new ApiError(401, "Unauthorized", url);
    }

    if (!res.ok) {
        let parsedBody: unknown = undefined;
        let bodyText = "";
        try {
            bodyText = await res.text();
            parsedBody = bodyText ? JSON.parse(bodyText) : undefined;
        } catch {
            parsedBody = bodyText || undefined;
        }

        if (bodyText) {
            console.error(`[Library API] ✗ Error body: ${bodyText.slice(0, 500)}`);
        }

        throw new ApiError(
            res.status,
            `Library API error ${res.status} ${res.statusText}`,
            url,
            parsedBody,
        );
    }

    return res.json() as Promise<T>;
}

// ─── Apps ─────────────────────────────────────────────────────────────────────

/**
 * GET /apps
 *
 * @example
 * // page 1, limit 10, all categories
 * getApps()
 *
 * // page 2, limit 5
 * getApps({ page: 2, limit: 5 })
 *
 * // MCP only
 * getApps({ category: "MCP" })
 *
 * // MCP, page 1, limit 5
 * getApps({ category: "MCP", page: 1, limit: 5 })
 */
export async function getApps(
    params: GetAppsParams = {},
    init?: RequestInit,
): Promise<GetAppsResponse> {
    const url = buildUrl("/apps", {
        page: params.page,
        limit: params.limit,
        category: params.category,
    });

    console.log(`[Library API] Fetching apps from: ${url}`);
    try {
        const response = await apiFetch<GetAppsResponse>(url, init);
        console.log(`[Library API] ✓ Fetch successful. Received ${response.data.length} groups`);
        return response;
    } catch (error) {
        console.error("[Library API] ✗ Fetch failed:", error instanceof Error ? error.message : error);
        throw error;
    }
}

/**
 * Fetch all apps and find the one matching the given app id.
 */
export async function getAppById(
    appId: string,
    init?: RequestInit,
): Promise<LibraryAppApiItem | null> {
    try {
        const normalizedTargetId = appId.trim().toLowerCase();
        const pageSize = 100;
        let currentPage = 1;
        let totalPages = 1;

        while (currentPage <= totalPages) {
            const response = await getApps({ page: currentPage, limit: pageSize }, init);
            const allApps = response.data.flatMap((group) => group.items);
            const matched = allApps.find(
                (item) => resolveAppId(item).trim().toLowerCase() === normalizedTargetId,
            );

            if (matched) return matched;

            totalPages = response.meta.totalPages || 1;
            currentPage += 1;
        }

        return null;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            throw error;
        }
        console.error(`Failed to fetch app by id: ${appId}`, error);
        return null;
    }
}

/**
 * Fetch related apps by category, excluding the current app.
 */
export async function getRelatedApps(
    appId: string,
    category: string,
    init?: RequestInit,
): Promise<LibraryAppApiItem[]> {
    try {
        const response = await getApps({ page: 1, limit: 100 }, init);
        const allApps = response.data.flatMap((group) => group.items);
        return allApps
            .filter((item) => resolveAppId(item) !== appId && item.category === category)
            .slice(0, 3);
    } catch (error) {
        console.error(`Failed to fetch related apps for ${appId}`, error);
        return [];
    }
}

// ─── Banners ──────────────────────────────────────────────────────────────────

/**
 * GET /banners
 *
 * @example
 * // first 3 banners
 * getBanners({ page: 1, limit: 3 })
 */
export async function getBanners(
    params: GetBannersParams = {},
    init?: RequestInit,
): Promise<GetBannersResponse> {
    const url = buildUrl("/banners", {
        page: params.page,
        limit: params.limit,
    });

    return apiFetch<GetBannersResponse>(url, init);
}

// ─── Manage Apps ─────────────────────────────────────────────────────────────

export function normalizeManageAppsList(payload: ManageAppListResponse): ManageAppApiItem[] {
    const maybeData = (payload as { data?: unknown }).data;

    if (
        Array.isArray(maybeData) &&
        (maybeData.length === 0 || (typeof maybeData[0] === "object" && maybeData[0] !== null && "name" in maybeData[0]))
    ) {
        return maybeData as ManageAppApiItem[];
    }

    const grouped = payload as GetAppsResponse;
    return grouped.data.flatMap((group) => group.items as ManageAppApiItem[]);
}

export async function getManageApps(init?: RequestInit): Promise<ManageAppApiItem[]> {
    const url = buildUrl("/manage/apps");
    const response = await apiFetch<ManageAppListResponse>(url, init);
    return normalizeManageAppsList(response);
}

export async function createManageApp(
    payload: ManageAppPayload,
    init?: RequestInit,
): Promise<ManageAppApiItem> {
    const url = buildUrl("/manage/apps");
    const response = await apiFetch<ManageAppMutationResponse>(url, {
        method: "POST",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}

export async function updateManageApp(
    id: string,
    payload: ManageAppPayload,
    init?: RequestInit,
): Promise<ManageAppApiItem> {
    const url = buildUrl(`/manage/apps/${id}`);
    const response = await apiFetch<ManageAppMutationResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}

export async function deleteManageApp(id: string, init?: RequestInit): Promise<void> {
    const url = buildUrl(`/manage/apps/${id}`);
    await apiFetch<{ success?: boolean; message?: string }>(url, {
        method: "DELETE",
        ...init,
    });
}

export type ManageDashboardStats = {
    appCount: number;
    activeAppCount: number;
    aiModelCount: number;
    activeAiModelCount: number;
    defaultAiModelName: string | null;
    lastUpdatedAt: string | null;
};

function getPaginatedTotal(meta?: PaginationMeta): number | null {
    if (!meta) return null;
    return typeof meta.total === "number" ? meta.total : null;
}

function pickLatestIsoDate(values: Array<string | null | undefined>): string | null {
    let latestTime = 0;
    let latestIso: string | null = null;

    for (const value of values) {
        if (!value) continue;
        const timestamp = Date.parse(value);
        if (Number.isNaN(timestamp)) continue;

        if (timestamp > latestTime) {
            latestTime = timestamp;
            latestIso = new Date(timestamp).toISOString();
        }
    }

    return latestIso;
}

async function fetchManageAiModelsPage(
    page: number,
    limit: number,
    init?: RequestInit,
): Promise<ManageAiListResponse> {
    return apiFetch<ManageAiListResponse>(
        buildUrl("/manage/models", {
            page,
            limit,
        }),
        init,
    ).catch(async (error) => {
        if (error instanceof ApiError && error.status === 404) {
            return apiFetch<ManageAiListResponse>(
                buildUrl("/manage/ai", {
                    page,
                    limit,
                }),
                init,
            );
        }

        throw error;
    });
}

export async function getUserProfile(init?: RequestInit): Promise<UserProfile> {
    const response = await apiFetch<UserProfileResponse>(buildUrl("/profile"), init);
    return response.data;
}

export async function getManageDashboardStats(
    init?: RequestInit,
): Promise<ManageDashboardStats> {
    const [apps, aiFirstPage] = await Promise.all([
        getManageApps(init),
        fetchManageAiModelsPage(1, 200, init),
    ]);

    const aiModels: ManageAiModelApiItem[] = [...(aiFirstPage.data ?? [])];
    const totalPages = aiFirstPage.meta?.totalPages ?? 1;

    for (let page = 2; page <= totalPages; page += 1) {
        const response = await fetchManageAiModelsPage(page, 200, init);
        aiModels.push(...(response.data ?? []));
    }

    const defaultModel = aiModels.find((model) => model.isDefault) ?? null;
    const lastUpdatedAt = pickLatestIsoDate([
        ...apps.map((app) => app.updatedAt),
        ...aiModels.map((model) => model.updatedAt),
    ]);

    return {
        appCount: apps.length,
        activeAppCount: apps.filter((app) => app.isActive).length,
        aiModelCount: getPaginatedTotal(aiFirstPage.meta) ?? aiModels.length,
        activeAiModelCount: aiModels.filter((model) => model.isActive).length,
        defaultAiModelName: defaultModel?.name ?? null,
        lastUpdatedAt,
    };
}

// ─── Manage AI Models ────────────────────────────────────────────────────────

export async function getManageAiModels(init?: RequestInit): Promise<ManageAiApiListItem[]> {
    const url = buildUrl("/manage/models", {
        page: 1,
        limit: 10,
    });

    try {
        const response = await apiFetch<ManageAiListResponse>(url, init);
        return response.data ?? [];
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            const fallbackUrl = buildUrl("/manage/ai", {
                page: 1,
                limit: 10,
            });
            const fallbackResponse = await apiFetch<ManageAiListResponse>(fallbackUrl, init);
            return fallbackResponse.data ?? [];
        }

        throw error;
    }
}

export async function createManageAiModel(
    payload: ManageAiModelPayload,
    init?: RequestInit,
): Promise<ManageAiModelApiItem> {
    const url = buildUrl("/manage/models");
    const response = await apiFetch<ManageAiMutationResponse>(url, {
        method: "POST",
        body: JSON.stringify(payload),
        ...init,
    });

    return response.data;
}

export async function updateManageAiModel(
    id: string,
    payload: Partial<ManageAiModelPayload>,
    init?: RequestInit,
): Promise<ManageAiModelApiItem> {
    const url = buildUrl(`/manage/models/${id}`);
    const response = await apiFetch<ManageAiMutationResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...init,
    });

    return response.data;
}

export async function deleteManageAiModel(id: string, init?: RequestInit): Promise<void> {
    const url = buildUrl(`/manage/models/${id}`);
    await apiFetch<{ success?: boolean; message?: string }>(url, {
        method: "DELETE",
        ...init,
    });
}

export async function setDefaultManageAiModel(
    id: string,
    init?: RequestInit,
): Promise<ManageAiModelApiItem> {
    return updateManageAiModel(id, { isDefault: true }, init);
}

// ─── Manage Menus ────────────────────────────────────────────────────────────

export async function getManageMenus(init?: RequestInit): Promise<ManageMenuItem[]> {
    const url = buildUrl("/access/menus");
    const response = await apiFetch<ManageMenuResponse>(url, init);
    return response.data;
}

// ─── Manage Tags ─────────────────────────────────────────────────────────────

export async function getManageTagsResponse(
    init?: RequestInit,
): Promise<ManageTagListResponse> {
    const url = buildUrl("/manage/tags", {
        page: 1,
        limit: 100,
    });
    return apiFetch<ManageTagListResponse>(url, init);
}

export async function getManageTags(init?: RequestInit): Promise<ManageTagApiItem[]> {
    const response = await getManageTagsResponse(init);
    return response.data ?? [];
}
