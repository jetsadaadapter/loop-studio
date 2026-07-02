import type {
    CategoryInfo,
    ManageCategoryListResponse,
    ManageCategoryPayload,
    ManageCategorySingleResponse,
} from "@/core/interfaces/categories.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

export async function getManageCategoriesResponse(
    init?: RequestInit,
): Promise<ManageCategoryListResponse> {
    const url = buildUrl("/manage/categories", {
        page: 1,
        limit: 100,
    });
    return apiFetch<ManageCategoryListResponse>(url, init);
}

export async function getManageCategories(init?: RequestInit): Promise<CategoryInfo[]> {
    const response = await getManageCategoriesResponse(init);
    return response.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────

export async function createManageCategory(
    payload: ManageCategoryPayload,
    init?: RequestInit,
): Promise<CategoryInfo> {
    const url = buildUrl("/manage/categories");
    const response = await apiFetch<ManageCategorySingleResponse>(url, {
        method: "POST",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────────────────────────────────────

export async function updateManageCategory(
    id: string,
    payload: ManageCategoryPayload,
    init?: RequestInit,
): Promise<CategoryInfo> {
    const url = buildUrl(`/manage/categories/${id}`);
    const response = await apiFetch<ManageCategorySingleResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteManageCategory(id: string, init?: RequestInit): Promise<void> {
    const url = buildUrl(`/manage/categories/${id}`);
    await apiFetch<{ success?: boolean; message?: string }>(url, {
        method: "DELETE",
        ...init,
    });
}
