import type {
    ManageTagApiItem,
    ManageTagListResponse,
} from "@/core/interfaces/library.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

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
