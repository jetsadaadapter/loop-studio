import type {
    UserProfile,
    UserProfileResponse,
} from "@/core/interfaces/auth.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

export interface ManageUserListResponse {
    success: boolean;
    message?: string;
    data: UserProfile[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface UpdateUserPayload {
    empid: string;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
    roles: string[];
}

export async function getUserProfile(init?: RequestInit): Promise<UserProfile> {
    const response = await apiFetch<UserProfileResponse>(buildUrl("/profile"), init);
    return response.data;
}

export async function getManageUsersResponse(
    init?: RequestInit,
): Promise<ManageUserListResponse> {
    const url = buildUrl("/manage/users", {
        page: 1,
        limit: 100,
    });
    return apiFetch<ManageUserListResponse>(url, init);
}

export async function getManageUsers(init?: RequestInit): Promise<UserProfile[]> {
    const response = await getManageUsersResponse(init);
    return response.data ?? [];
}

export async function updateManageUser(
    empid: string,
    payload: Omit<UpdateUserPayload, "empid">,
    init?: RequestInit,
): Promise<UserProfile> {
    const url = buildUrl(`/manage/users/${empid}`);
    const response = await apiFetch<{ success: boolean; data: UserProfile }>(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...init,
    });
    return response.data;
}
