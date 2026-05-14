import type {
    GetBannersParams,
    GetBannersResponse,
    LibraryBannerItem,
    ManageBannerPayload,
} from "@/core/interfaces/banners.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

// ─────────────────────────────────────────────────────────────────────────────
// Banners
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Manage Banners
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteManageBanner(id: string, init?: RequestInit): Promise<void> {
    const url = buildUrl(`/manage/banners/${id}`);
    await apiFetch<{ success?: boolean; message?: string }>(url, {
        method: "DELETE",
        ...init,
    });
}

export async function getManageBanners(
    params: GetBannersParams = {},
    init?: RequestInit,
): Promise<GetBannersResponse> {
    const url = buildUrl("/manage/banners", {
        page: params.page,
        limit: params.limit,
    });
    return apiFetch<GetBannersResponse>(url, init);
}

export async function getManageBanner(id: string, init?: RequestInit): Promise<LibraryBannerItem> {
    const url = buildUrl(`/manage/banners/${id}`);
    const response = await apiFetch<{ data: LibraryBannerItem }>(url, init);
    return response.data;
}

export async function createManageBanner(
    payload: ManageBannerPayload,
    init?: RequestInit,
): Promise<LibraryBannerItem> {
    const url = buildUrl("/manage/banners");
    const response = await apiFetch<{ data: LibraryBannerItem }>(url, {
        method: "POST",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}

export async function updateManageBanner(
    id: string,
    payload: ManageBannerPayload,
    init?: RequestInit,
): Promise<LibraryBannerItem> {
    const url = buildUrl(`/manage/banners/${id}`);
    const response = await apiFetch<{ data: LibraryBannerItem }>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}
