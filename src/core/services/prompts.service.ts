import type {
    PromptItem,
    PromptsResponse,
    CreatePromptPayload,
} from "@/core/interfaces/prompt";
import { apiFetch, buildUrl } from "@/core/services/api";

export async function getManagePrompts(params?: Record<string, string>, init?: RequestInit): Promise<PromptItem[]> {
    const url = buildUrl("/manage/prompts", params);
    const response = await apiFetch<PromptsResponse>(url, init);
    return response.data || [];
}

export async function createManagePrompt(payload: CreatePromptPayload): Promise<PromptItem> {
    const url = buildUrl("/manage/prompts");
    const response = await apiFetch<{ success: boolean; message: string; data: PromptItem }>(url, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response.data;
}

export async function updateManagePrompt(id: string, payload: Partial<CreatePromptPayload>): Promise<PromptItem> {
    const url = buildUrl(`/manage/prompts/${id}`);
    const response = await apiFetch<{ success: boolean; message: string; data: PromptItem }>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
    return response.data;
}

export async function deleteManagePrompt(id: string): Promise<void> {
    const url = buildUrl(`/manage/prompts/${id}`);
    await apiFetch<{ success: boolean; message: string }>(url, {
        method: "DELETE",
    });
}
