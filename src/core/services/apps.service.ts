import type {
    GetAppsParams,
    GetAppsResponse,
    LibraryAppApiItem,
    ManageAppApiItem,
    ManageAppListResponse,
    ManageAppMutationResponse,
    ManageAppPayload,
} from "@/core/interfaces/apps.interface";
import type { Paginated, PaginationMeta } from "@/core/interfaces/common.interface";
import type { LibraryBannerItem } from "@/core/interfaces/banners.interface";
import { getAppItemId as resolveAppId } from "@/core/interfaces/apps.interface";
import { ApiError, apiFetch, buildUrl } from "@/core/services/api";

// ─────────────────────────────────────────────────────────────────────────────
// Apps
// ─────────────────────────────────────────────────────────────────────────────

export async function getApps(
    params: GetAppsParams = {},
    init?: RequestInit,
): Promise<GetAppsResponse> {
    const url = buildUrl("/apps", {
        page: params.page,
        limit: params.limit,
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

export async function getAppById(
    appId: string,
    init?: RequestInit,
): Promise<LibraryAppApiItem | null> {
    try {
        const url = buildUrl(`/apps/${appId}`);
        const response = await apiFetch<{ data: LibraryAppApiItem }>(url, init);
        return response.data;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            throw error;
        }
        console.error(`Failed to fetch app by id: ${appId}`, error);
        return null;
    }
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Manage Apps
// ─────────────────────────────────────────────────────────────────────────────

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

export async function getManageApps(
    params: { page?: number; limit?: number } = {},
    init?: RequestInit
): Promise<Paginated<ManageAppApiItem>> {
    const url = buildUrl("/manage/apps", {
        page: params.page,
        limit: params.limit,
    });
    const response = await apiFetch<Paginated<ManageAppApiItem>>(url, init);
    return response;
}

export async function createManageApp(
    payload: ManageAppPayload,
    init?: RequestInit,
): Promise<ManageAppApiItem> {
    const url = buildUrl("/manage/apps");
    console.log("[ManageApp] Creating app with payload:", payload);
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
    console.log(`[ManageApp] Updating app ${id} with payload:`, payload);
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
    bannerCount: number;
    activeBannerCount: number;
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

export async function getManageDashboardStats(
    init?: RequestInit,
): Promise<ManageDashboardStats> {
    // We import getManageAiModels and getManageBanners dynamically to avoid circular dependencies if any
    const { getManageAiModelsResponse } = await import("@/core/services/models.service");
    const { getManageBanners } = await import("@/core/services/banners.service");

    const [appsPage, aiFirstPage, bannerResponse] = await Promise.all([
        getManageApps({ page: 1, limit: 1000 }, init),
        getManageAiModelsResponse(1, 200, init),
        getManageBanners({ page: 1, limit: 200 }, init).catch(() => ({
            data: [],
            meta: { page: 1, limit: 200, total: 0, totalPages: 1 },
        })),
    ]);

    const apps = appsPage.data ?? [];
    const aiModels = [...(aiFirstPage.data ?? [])];
    const totalPages = aiFirstPage.meta?.totalPages ?? 1;

    for (let page = 2; page <= totalPages; page += 1) {
        const response = await getManageAiModelsResponse(page, 200, init);
        aiModels.push(...(response.data ?? []));
    }

    const defaultModel = aiModels.find((model) => model.isDefault) ?? null;
    const lastUpdatedAt = pickLatestIsoDate([
        ...apps.map((app: ManageAppApiItem) => app.updatedAt),
        ...aiModels.map((model) => model.updatedAt),
        ...bannerResponse.data.map((banner: LibraryBannerItem) => banner.updatedAt),
    ]);

    return {
        appCount: getPaginatedTotal(appsPage.meta) ?? apps.length,
        activeAppCount: apps.filter((app: ManageAppApiItem) => app.isActive).length,
        aiModelCount: getPaginatedTotal(aiFirstPage.meta) ?? aiModels.length,
        activeAiModelCount: aiModels.filter((model) => model.isActive).length,
        bannerCount: getPaginatedTotal(bannerResponse.meta) ?? bannerResponse.data.length,
        activeBannerCount: bannerResponse.data.filter((b: LibraryBannerItem) => b.isActive).length,
        defaultAiModelName: defaultModel?.name ?? null,
        lastUpdatedAt,
    };
}
