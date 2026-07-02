import { ApiError } from "@/core/services/api";
import type {
    ManageAiApiListItem,
    ManageAiListResponse,
    ManageAiModelApiItem,
    ManageAiModelPayload,
    ManageAiMutationResponse,
} from "@/core/interfaces/models.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

// ─────────────────────────────────────────────────────────────────────────────
// Manage AI Models
// ─────────────────────────────────────────────────────────────────────────────

export async function getManageAiModelsResponse(
    page: number,
    limit: number,
    init?: RequestInit,
): Promise<ManageAiListResponse> {
    return apiFetch<ManageAiListResponse>(
        buildUrl("/manage/models", {
            page,
            limit,
        }),
        init,
    ).catch(async (error) => {
        if (error instanceof ApiError && error.status === 404) {
            return apiFetch<ManageAiListResponse>(
                buildUrl("/manage/ai", {
                    page,
                    limit,
                }),
                init,
            );
        }

        throw error;
    });
}

export async function getManageAiModels(init?: RequestInit): Promise<ManageAiApiListItem[]> {
    const url = buildUrl("/manage/models", {
        page: 1,
        limit: 10,
    });

    try {
        const response = await apiFetch<ManageAiListResponse>(url, init);
        return response.data ?? [];
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            const fallbackUrl = buildUrl("/manage/ai", {
                page: 1,
                limit: 10,
            });
            const fallbackResponse = await apiFetch<ManageAiListResponse>(fallbackUrl, init);
            return fallbackResponse.data ?? [];
        }

        throw error;
    }
}

export async function createManageAiModel(
    payload: ManageAiModelPayload,
    init?: RequestInit,
): Promise<ManageAiModelApiItem> {
    const url = buildUrl("/manage/models");
    const response = await apiFetch<ManageAiMutationResponse>(url, {
        method: "POST",
        body: JSON.stringify(payload),
        ...init,
    });

    return response.data;
}

export async function updateManageAiModel(
    id: string,
    payload: Partial<ManageAiModelPayload>,
    init?: RequestInit,
): Promise<ManageAiModelApiItem> {
    const url = buildUrl(`/manage/models/${id}`);
    const response = await apiFetch<ManageAiMutationResponse>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...init,
    });

    return response.data;
}

export async function deleteManageAiModel(id: string, init?: RequestInit): Promise<void> {
    const url = buildUrl(`/manage/models/${id}`);
    await apiFetch<{ success?: boolean; message?: string }>(url, {
        method: "DELETE",
        ...init,
    });
}

export async function setDefaultManageAiModel(
    id: string,
    init?: RequestInit,
): Promise<ManageAiModelApiItem> {
    return updateManageAiModel(id, { isDefault: true }, init);
}
