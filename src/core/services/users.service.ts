import type {
    UserProfile,
    UserProfileResponse,
} from "@/core/interfaces/auth.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

export async function getUserProfile(init?: RequestInit): Promise<UserProfile> {
    const response = await apiFetch<UserProfileResponse>(buildUrl("/profile"), init);
    return response.data;
}
