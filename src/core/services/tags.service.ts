import type {
    ManageTagApiItem,
    ManageTagListResponse,
    ManageTagPayload,
    ManageTagSingleResponse,
} from "@/core/interfaces/tags.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────

export async function createManageTag(
    payload: ManageTagPayload,
    init?: RequestInit,
): Promise<ManageTagApiItem> {
    const url = buildUrl("/manage/tags");
    const response = await apiFetch<ManageTagSingleResponse>(url, {
        method: "POST",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────────────────────────────────────

export async function updateManageTag(
    id: string,
    payload: ManageTagPayload,
    init?: RequestInit,
): Promise<ManageTagApiItem> {
    const url = buildUrl(`/manage/tags/${id}`);
    const response = await apiFetch<ManageTagSingleResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteManageTag(id: string, init?: RequestInit): Promise<void> {
    const url = buildUrl(`/manage/tags/${id}`);
    await apiFetch<{ success?: boolean; message?: string }>(url, {
        method: "DELETE",
        ...init,
    });
}
