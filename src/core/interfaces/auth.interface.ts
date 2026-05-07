/**
 * Auth-related contracts.
 * Extend as roles/permissions are defined via Centralized MCP Auth token.
 */
export type UserRole = "admin" | "user" | "viewer";

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    image?: string;
}

export interface UserProfile {
    empid: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
    department: string;
    position: string;
    roles: UserRole[];
    createdAt: string;
    updatedAt: string;
}

export interface UserProfileResponse {
    success: boolean;
    message?: string;
    data: UserProfile;
}
