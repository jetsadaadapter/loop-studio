import type {
    ManageToolApiItem,
    ManageToolListResponse,
    ToolDetailResponse,
    CreateToolPayload,
    UpdateToolPayload,
    ToolParam,
    ToolParamsResponse,
    ToolParamPayload,
} from "@/core/interfaces/tool";
import { apiFetch, buildUrl } from "@/core/services/api";

export async function getManageTools(init?: RequestInit): Promise<ManageToolApiItem[]> {
    const url = buildUrl("/manage/tools");
    const response = await apiFetch<ManageToolListResponse>(url, init);
    return response.data;
}

export async function getManageTool(id: string, init?: RequestInit): Promise<ManageToolApiItem> {
    const url = buildUrl(`/manage/tools/${id}`);
    const response = await apiFetch<ToolDetailResponse>(url, init);
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

export async function getManageToolParams(toolId: string, init?: RequestInit): Promise<ToolParam[]> {
    const url = buildUrl(`/manage/tools/${toolId}/params`);
    const response = await apiFetch<ToolParamsResponse>(url, init);
    return response.data;
}

export async function addManageToolParam(toolId: string, payload: ToolParamPayload): Promise<ToolParam> {
    const url = buildUrl(`/manage/tools/${toolId}/params`);
    const response = await apiFetch<{ success: boolean; message: string; data: ToolParam }>(url, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response.data;
}

export async function updateManageToolParam(paramId: string, payload: ToolParamPayload): Promise<ToolParam> {
    const url = buildUrl(`/manage/tools/params/${paramId}`);
    const response = await apiFetch<{ success: boolean; message: string; data: ToolParam }>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
    return response.data;
}
export async function deleteManageToolParam(paramId: string): Promise<void> {
    const url = buildUrl(`/manage/tools/params/${paramId}`);
    await apiFetch<{ success: boolean; message: string }>(url, {
        method: "DELETE",
    });
}

export async function upsertManageToolParams(toolId: string, payload: ToolParamPayload[]): Promise<ToolParam[]> {
    const url = buildUrl(`/manage/tools/${toolId}/params`);
    const response = await apiFetch<{ success: boolean; message: string; data: ToolParam[] }>(url, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    return response.data;
}
