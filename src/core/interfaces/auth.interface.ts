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
