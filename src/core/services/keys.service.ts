import { ApiError } from "@/core/services/api";
import type {
    ManageApiKeyItem,
    ManageApiKeyListResponse,
    ManageApiKeyPayload,
    ManageApiKeyMutationResponse,
    ManageApiKeyCreatedData,
} from "@/core/interfaces/keys.interface";
import { apiFetch, buildUrl, type ApiFetchOptions } from "@/core/services/api";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

const LOCAL_STORAGE_KEY = "adt_manage_api_keys";

// Pre-populated mock keys for localStorage fallback
const MOCK_KEYS: ManageApiKeyItem[] = [
    {
        id: "29634c13-d8fc-4604-b9fd-bb14dcdca468",
        appId: "app_01ktp0p9f679nf2pm2z57sgsd1",
        name: "My App",
        ownerId: "6E88D7AA-54F2-4CE7-99FA-AB6D97920E0B",
        isActive: true,
        webhookUrl: "https://webhook.site/a63a068d-8139-4240-a36f-e12340bf3e02",
        createdAt: "2026-06-09T04:01:12.466Z",
        updatedAt: "2026-06-09T04:01:12.466Z",
    },
    {
        id: "782cd4a1-b12a-4a29-87a2-bb8f4c12d46a",
        appId: "app_01ktqrsb2dgr6zw8jjkgbeg505",
        name: "Staging Classifier",
        ownerId: "6E88D7AA-54F2-4CE7-99FA-AB6D97920E0B",
        isActive: false,
        webhookUrl: "",
        createdAt: "2026-06-10T10:15:30.000Z",
        updatedAt: "2026-06-10T10:15:30.000Z",
    }
];

function getLocalKeys(): ManageApiKeyItem[] {
    if (typeof window === "undefined") return MOCK_KEYS;
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_KEYS));
        return MOCK_KEYS;
    }
    try {
        return JSON.parse(raw) as ManageApiKeyItem[];
    } catch {
        return MOCK_KEYS;
    }
}

function saveLocalKeys(keys: ManageApiKeyItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys));
}

function getLocalProjectsList(): ProjectItem[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("adt_manage_projects");
    if (!raw) return [];
    try {
        return JSON.parse(raw) as ProjectItem[];
    } catch {
        return [];
    }
}

function mergeProjectsToKeys(keysList: ManageApiKeyItem[]): ManageApiKeyItem[] {
    const projects = getLocalProjectsList();
    return keysList.map((key) => {
        const proj = key.projectId ? projects.find((p) => p.id === key.projectId) : null;
        return {
            ...key,
            project: proj || null,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Manage API Keys Service
// ─────────────────────────────────────────────────────────────────────────────

export async function getManageApiKeysResponse(
    page: number,
    limit: number,
    init?: ApiFetchOptions,
): Promise<ManageApiKeyListResponse> {
    try {
        const url = buildUrl("/keys", { page, limit });
        const response = await apiFetch<ManageApiKeyListResponse & { fallback?: boolean }>(url, {
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Keys endpoint not implemented on upstream", url);
        }
        return response;
    } catch (error) {
        // Fallback if 404 or network error
        if (error instanceof ApiError && (error.status === 404 || error.status === 401)) {
            console.warn("[Keys Service] API keys endpoint 404/401, falling back to localStorage.");
        } else {
            console.error("[Keys Service] API keys fetch error, falling back to localStorage:", error);
        }

        const allKeys = getLocalKeys();
        const start = (page - 1) * limit;
        const pagedKeys = allKeys.slice(start, start + limit);
        const totalPages = Math.ceil(allKeys.length / limit);

        return {
            success: true,
            message: "Keys fetched from local fallback",
            data: mergeProjectsToKeys(pagedKeys),
            meta: {
                total: allKeys.length,
                page,
                limit,
                totalPages,
            },
        };
    }
}

export async function createManageApiKey(
    payload: { name: string; projectId?: string | null },
    init?: ApiFetchOptions,
): Promise<ManageApiKeyCreatedData> {
    try {
        const url = buildUrl("/keys");
        const response = await apiFetch<ManageApiKeyMutationResponse & { fallback?: boolean }>(url, {
            method: "POST",
            body: JSON.stringify(payload),
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Keys endpoint not implemented on upstream", url);
        }
        return response.data as ManageApiKeyCreatedData;
    } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
            throw error;
        }
        console.warn("[Keys Service] createManageApiKey failed, using local fallback:", error);
        
        const randomHex = Array.from({ length: 48 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join("");
        const secret = `sk_live_${randomHex}`;
        const appId = `app_01kt${Array.from({ length: 22 }, () =>
            Math.floor(Math.random() * 36).toString(36)
        ).join("")}`;
        const createdAt = new Date().toISOString();

        const newCreated: ManageApiKeyCreatedData = {
            appId,
            secret,
            name: payload.name,
            createdAt,
        };

        const projects = getLocalProjectsList();
        const proj = payload.projectId ? projects.find((p) => p.id === payload.projectId) : null;

        const newItem: ManageApiKeyItem = {
            id: Math.random().toString(36).substring(2),
            appId,
            name: payload.name,
            projectId: payload.projectId || null,
            project: proj || null,
            ownerId: "6E88D7AA-54F2-4CE7-99FA-AB6D97920E0B",
            isActive: true,
            webhookUrl: "",
            createdAt,
            updatedAt: createdAt,
        };

        const all = getLocalKeys();
        saveLocalKeys([newItem, ...all]);

        return newCreated;
    }
}

export async function updateManageApiKey(
    appId: string,
    payload: ManageApiKeyPayload,
    init?: ApiFetchOptions,
): Promise<ManageApiKeyItem[] | ManageApiKeyItem> {
    try {
        const url = buildUrl(`/keys/${appId}`);
        const response = await apiFetch<ManageApiKeyMutationResponse & { fallback?: boolean }>(url, {
            method: "PATCH",
            body: JSON.stringify(payload),
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Keys endpoint not implemented on upstream", url);
        }
        return response.data as ManageApiKeyItem[] | ManageApiKeyItem;
    } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
            throw error;
        }
        console.warn("[Keys Service] updateManageApiKey failed, using local fallback:", error);
        
        const projects = getLocalProjectsList();
        const all = getLocalKeys();
        const nextKeys = all.map((item) => {
            if (item.appId === appId) {
                const name = payload.name !== undefined ? payload.name : item.name;
                const webhookUrl = payload.webhookUrl !== undefined ? payload.webhookUrl : item.webhookUrl;
                const isActive = payload.isActive !== undefined ? payload.isActive : item.isActive;
                const projectId = payload.projectId !== undefined ? payload.projectId : item.projectId;
                const proj = projectId ? projects.find((p) => p.id === projectId) : null;

                return {
                    ...item,
                    name,
                    webhookUrl,
                    isActive,
                    projectId,
                    project: proj || null,
                    updatedAt: new Date().toISOString(),
                };
            }
            return item;
        });

        saveLocalKeys(nextKeys);
        return nextKeys;
    }
}

export async function deleteManageApiKey(appId: string, init?: ApiFetchOptions): Promise<void> {
    try {
        const url = buildUrl(`/keys/${appId}`);
        const response = await apiFetch<{ success?: boolean; message?: string; fallback?: boolean }>(url, {
            method: "DELETE",
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Keys endpoint not implemented on upstream", url);
        }
    } catch (error) {
        console.warn("[Keys Service] deleteManageApiKey failed, using local fallback:", error);
        
        const all = getLocalKeys();
        const nextKeys = all.filter((item) => item.appId !== appId);
        saveLocalKeys(nextKeys);
    }
}
