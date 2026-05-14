import type {
    GetBannersParams,
    GetBannersResponse,
} from "@/core/interfaces/library.interface";
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
