import type {
    UserProfile,
    UserProfileResponse,
} from "@/core/interfaces/auth.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

interface ManageUserListResponse {
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

interface UpdateUserPayload {
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
    params?: { page?: number; limit?: number },
    init?: RequestInit,
): Promise<ManageUserListResponse> {
    const url = buildUrl("/manage/users", {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
    });
    return apiFetch<ManageUserListResponse>(url, init);
}

export async function getManageUsers(
    params?: { page?: number; limit?: number },
    init?: RequestInit,
): Promise<UserProfile[]> {
    const response = await getManageUsersResponse(params, init);
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

interface CreditBalance {
    credits: number;
}

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    type: string;
    clientType?: string;
    referenceId?: string | null;
    description: string;
    createdAt: string;
}

interface CreditHistoryResponse {
    success: boolean;
    data: CreditTransaction[];
    total: number;
    page: number;
    limit: number;
}

export async function getUserCredits(init?: RequestInit): Promise<CreditBalance> {
    const response = await apiFetch<{ success: boolean; data: CreditBalance }>(buildUrl("/profile/credits"), init);
    return response.data;
}

export async function getCreditHistory(
    params?: { page?: number; limit?: number },
    init?: RequestInit,
): Promise<CreditHistoryResponse> {
    const url = buildUrl("/profile/credits/history", {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
    });
    return apiFetch<CreditHistoryResponse>(url, init);
}

export async function adjustUserCredits(
    userId: string,
    amount: number,
    description: string,
    init?: RequestInit,
): Promise<{ success: boolean }> {
    const url = buildUrl(`/manage/users/${userId}/credits/adjust`);
    return apiFetch<{ success: boolean }>(url, {
        method: "POST",
        body: JSON.stringify({ amount, description }),
        ...init,
    });
}
