import type {
    ManageToolApiItem,
    ManageToolListResponse,
    ToolDetailResponse,
    CreateToolPayload,
    UpdateToolPayload,
} from "@/core/interfaces/tool";
import { apiFetch, buildUrl } from "@/core/services/api";

export async function getManageTools(init?: RequestInit): Promise<ManageToolApiItem[]> {
    const url = buildUrl("/manage/tools");
    const response = await apiFetch<ManageToolListResponse>(url, init);
    return response.data;
}

export async function createManageTool(payload: CreateToolPayload): Promise<ManageToolApiItem> {
    const url = buildUrl("/manage/tools");
    const response = await apiFetch<ToolDetailResponse>(url, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response.data;
}

export async function updateManageTool(id: string, payload: UpdateToolPayload): Promise<ManageToolApiItem> {
    const url = buildUrl(`/manage/tools/${id}`);
    const response = await apiFetch<ToolDetailResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
    return response.data;
}

export async function deleteManageTool(id: string): Promise<void> {
    const url = buildUrl(`/manage/tools/${id}`);
    await apiFetch<{ success: boolean; message: string }>(url, {
        method: "DELETE",
    });
}
