import type {
    CategoryInfo,
    ManageCategoryListResponse,
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
