import type { ManageToolApiItem, ManageToolListResponse } from "@/core/interfaces/tool";
import { apiFetch, buildUrl } from "@/core/services/api";

export async function getManageTools(init?: RequestInit): Promise<ManageToolApiItem[]> {
    const url = buildUrl("/manage/tools");
    const response = await apiFetch<ManageToolListResponse>(url, init);
    return response.data;
}
