import { ApiError } from "@/core/services/api";
import type {
    ProjectItem,
    ProjectListResponse,
    ProjectPayload,
    ProjectMutationResponse,
} from "@/core/interfaces/projects.interface";
import { apiFetch, buildUrl, type ApiFetchOptions } from "@/core/services/api";
import { MOCK_PROJECTS, type ProjectActivity } from "./projects-mock-data";

const LOCAL_STORAGE_KEY = "adt_manage_projects";
const LOCAL_STORAGE_ACTIVITIES_KEY = "adt_manage_projects_activities";
const LOCAL_STORAGE_CONNECTIONS_KEY = "adt_manage_projects_connections";

interface ProjectConnections {
    connectedAppIds: string[];
    connectedToolIds: string[];
    connectedApiKeyIds: string[];
}

function getLocalProjects(): ProjectItem[] {
    if (typeof window === "undefined") return MOCK_PROJECTS;
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_PROJECTS));
        return MOCK_PROJECTS;
    }
    try {
        return JSON.parse(raw) as ProjectItem[];
    } catch {
        return MOCK_PROJECTS;
    }
}

function saveLocalProjects(projects: ProjectItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
}

function getLocalConnections(): Record<string, ProjectConnections> {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(LOCAL_STORAGE_CONNECTIONS_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw) as Record<string, ProjectConnections>;
    } catch {
        return {};
    }
}

function saveLocalConnections(connections: Record<string, ProjectConnections>) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_CONNECTIONS_KEY, JSON.stringify(connections));
}

function mergeConnections(projects: ProjectItem[]): ProjectItem[] {
    const connMap = getLocalConnections();
    return projects.map((p) => ({
        ...p,
        connectedAppIds: connMap[p.id]?.connectedAppIds ?? p.connectedAppIds ?? [],
        connectedToolIds: connMap[p.id]?.connectedToolIds ?? p.connectedToolIds ?? [],
        connectedApiKeyIds: connMap[p.id]?.connectedApiKeyIds ?? p.connectedApiKeyIds ?? [],
    }));
}

function mergeSingleConnection(p: ProjectItem): ProjectItem {
    const connMap = getLocalConnections();
    return {
        ...p,
        connectedAppIds: connMap[p.id]?.connectedAppIds ?? p.connectedAppIds ?? [],
        connectedToolIds: connMap[p.id]?.connectedToolIds ?? p.connectedToolIds ?? [],
        connectedApiKeyIds: connMap[p.id]?.connectedApiKeyIds ?? p.connectedApiKeyIds ?? [],
    };
}

// Fake seed userIds that were previously hardcoded — purge them on load
const LEGACY_FAKE_USER_IDS = new Set(["user_1", "user_2"]);

function getLocalActivities(): ProjectActivity[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
    if (!raw) {
        return [];
    }
    try {
        const all = JSON.parse(raw) as ProjectActivity[];
        // Purge any legacy fake-seeded activities (old hardcoded John Doe / Sarah Smith entries)
        const real = all.filter((a) => !LEGACY_FAKE_USER_IDS.has(a.userId));
        if (real.length !== all.length) {
            // Save purged list back so it doesn't need purging again
            localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(real));
        }
        return real;
    } catch {
        return [];
    }
}

function saveLocalActivities(activities: ProjectActivity[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(activities));
}

export function logActivity(
    action: string,
    targetName: string,
    projectName: string,
    priority?: "low" | "medium" | "high" | "urgent" | "in progress",
    userContext?: { userId?: string; userName?: string; userAvatar?: string }
) {
    const list = getLocalActivities();
    const newAct: ProjectActivity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: userContext?.userId ?? "",
        userName: userContext?.userName ?? "You",
        userAvatar: userContext?.userAvatar ?? undefined,
        action,
        targetName,
        projectName,
        priority: priority ?? "low",
        createdAt: new Date().toISOString()
    };
    saveLocalActivities([newAct, ...list]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Manage Projects Service
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjectsResponse(
    page: number,
    limit: number,
    search?: string,
    init?: ApiFetchOptions,
): Promise<ProjectListResponse> {
    try {
        const url = buildUrl("/projects", { page, limit, search });
        const response = await apiFetch<ProjectListResponse & { fallback?: boolean }>(url, {
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Projects endpoint not implemented on upstream", url);
        }
        if (response.success && response.data) {
            response.data = mergeConnections(response.data);
        }
        return response;
    } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 401)) {
            console.warn("[Projects Service] Projects endpoint 404/401, falling back to localStorage.");
        } else {
            console.error("[Projects Service] Projects fetch error, falling back to localStorage:", error);
        }

        let allProjects = getLocalProjects();
        if (search) {
            const query = search.toLowerCase();
            allProjects = allProjects.filter((p) => p.name.toLowerCase().includes(query));
        }

        const start = (page - 1) * limit;
        const pagedProjects = allProjects.slice(start, start + limit);
        const totalPages = Math.ceil(allProjects.length / limit);

        return {
            success: true,
            message: "Projects fetched from local fallback",
            data: mergeConnections(pagedProjects),
            meta: {
                total: allProjects.length,
                page,
                limit,
                totalPages,
            },
        };
    }
}

export async function createProject(
    payload: { name: string },
    init?: ApiFetchOptions,
    userContext?: { userId?: string; userName?: string; userAvatar?: string },
): Promise<ProjectItem> {
    try {
        const url = buildUrl("/projects");
        const response = await apiFetch<ProjectMutationResponse & { fallback?: boolean; data: ProjectItem }>(url, {
            method: "POST",
            body: JSON.stringify(payload),
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Projects endpoint not implemented on upstream", url);
        }
        logActivity("created project", payload.name, payload.name, "low", userContext);
        return mergeSingleConnection(response.data);
    } catch {
        const id = Array.from({ length: 26 }, () =>
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 36)]
        ).join("");
        const createdAt = new Date().toISOString();

        const newItem: ProjectItem = {
            id,
            name: payload.name,
            credits: 0,
            userId: userContext?.userId ?? "",
            createdAt,
            updatedAt: createdAt,
            connectedAppIds: [],
            connectedToolIds: [],
            connectedApiKeyIds: []
        };

        const all = getLocalProjects();
        saveLocalProjects([newItem, ...all]);
        logActivity("created project", payload.name, payload.name, "low", userContext);

        return newItem;
    }
}

export async function updateProject(
    id: string,
    payload: ProjectPayload,
    init?: ApiFetchOptions,
    userContext?: { userId?: string; userName?: string; userAvatar?: string },
): Promise<ProjectItem> {
    try {
        const url = buildUrl(`/projects/${id}`);
        const response = await apiFetch<ProjectMutationResponse & { fallback?: boolean; data: ProjectItem }>(url, {
            method: "PATCH",
            body: JSON.stringify(payload),
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Projects endpoint not implemented on upstream", url);
        }
        logActivity("renamed project to", response.data.name, response.data.name, "low", userContext);
        return mergeSingleConnection(response.data);
    } catch {
        const all = getLocalProjects();
        let updatedItem: ProjectItem | undefined;
        
        const nextProjects = all.map((item) => {
            if (item.id === id) {
                updatedItem = {
                    ...item,
                    name: payload.name !== undefined ? payload.name : item.name,
                    updatedAt: new Date().toISOString(),
                };
                return updatedItem;
            }
            return item;
        });

        if (!updatedItem) {
            throw new Error("Project not found");
        }

        saveLocalProjects(nextProjects);
        logActivity("renamed project to", updatedItem.name, updatedItem.name, "low", userContext);
        return updatedItem;
    }
}

export async function deleteProject(
    id: string,
    init?: ApiFetchOptions,
    userContext?: { userId?: string; userName?: string; userAvatar?: string },
): Promise<void> {
    try {
        const url = buildUrl(`/projects/${id}`);
        const response = await apiFetch<{ success?: boolean; message?: string; fallback?: boolean }>(url, {
            method: "DELETE",
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Projects endpoint not implemented on upstream", url);
        }
    } catch {
        const all = getLocalProjects();
        const target = all.find((p) => p.id === id);
        const nextProjects = all.filter((item) => item.id !== id);
        saveLocalProjects(nextProjects);
        if (target) {
            logActivity("deleted project", target.name, target.name, "urgent", userContext);
        }
    }
}

export async function topUpProjectCredits(
    id: string,
    amount: number,
    description: string = "Top-up credits",
    init?: ApiFetchOptions,
    userContext?: { userId?: string; userName?: string; userAvatar?: string },
): Promise<{ success: boolean; data?: ProjectItem }> {
    try {
        const url = buildUrl(`/projects/${id}/credits/adjust`);
        const response = await apiFetch<{ success: boolean; data?: ProjectItem; fallback?: boolean }>(url, {
            method: "POST",
            body: JSON.stringify({ amount, description }),
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Projects topup endpoint not implemented on upstream", url);
        }
        logActivity("topped up credits", `${amount.toLocaleString()} credits`, response.data?.name || `Project (${id})`, "low", userContext);
        return { success: true, data: response.data ? mergeSingleConnection(response.data) : undefined };
    } catch {
        const all = getLocalProjects();
        let updatedItem: ProjectItem | undefined;
        
        const nextProjects = all.map((item) => {
            if (item.id === id) {
                updatedItem = {
                    ...item,
                    credits: item.credits + amount,
                    updatedAt: new Date().toISOString(),
                };
                return updatedItem;
            }
            return item;
        });

        if (!updatedItem) {
            throw new Error("Project not found");
        }

        saveLocalProjects(nextProjects);
        logActivity("topped up credits", `${amount.toLocaleString()} credits`, updatedItem.name, "low", userContext);
        return { success: true, data: updatedItem };
    }
}

export async function updateProjectConnections(
    id: string,
    appIds: string[],
    toolIds: string[],
    apiKeyIds: string[],
    init?: ApiFetchOptions,
    userContext?: { userId?: string; userName?: string; userAvatar?: string }
): Promise<ProjectItem> {
    const connMap = getLocalConnections();
    connMap[id] = {
        connectedAppIds: appIds,
        connectedToolIds: toolIds,
        connectedApiKeyIds: apiKeyIds,
    };
    saveLocalConnections(connMap);

    try {
        const url = buildUrl(`/projects/${id}/connections`);
        const response = await apiFetch<{ success: boolean; data: ProjectItem; fallback?: boolean }>(url, {
            method: "POST",
            body: JSON.stringify({ appIds, toolIds, apiKeyIds }),
            silentErrors: true,
            ...init,
        });
        if (response.fallback) {
            throw new ApiError(404, "Projects connection endpoint not implemented", url);
        }
        logActivity("updated assets connections for", response.data.name, response.data.name, "in progress", userContext);
        return mergeSingleConnection(response.data);
    } catch {
        const all = getLocalProjects();
        let updatedItem: ProjectItem | undefined;

        const nextProjects = all.map((item) => {
            if (item.id === id) {
                updatedItem = {
                    ...item,
                    connectedAppIds: appIds,
                    connectedToolIds: toolIds,
                    connectedApiKeyIds: apiKeyIds,
                    updatedAt: new Date().toISOString()
                };
                return updatedItem;
            }
            return item;
        });

        if (!updatedItem) {
            throw new Error("Project not found");
        }

        saveLocalProjects(nextProjects);
        logActivity("updated assets connections for", updatedItem.name, updatedItem.name, "in progress", userContext);
        return updatedItem;
    }
}

export async function getActivities(
    page: number,
    limit: number
): Promise<{ success: boolean; data: ProjectActivity[]; total: number }> {
    const list = getLocalActivities();
    const start = (page - 1) * limit;
    const paged = list.slice(start, start + limit);
    return {
        success: true,
        data: paged,
        total: list.length
    };
}
