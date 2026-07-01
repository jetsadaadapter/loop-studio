export enum Role {
    SystemAdmin = 'system-admin',
    Admin = 'admin',
    Developer = 'developer',
    User = 'user'
}

export type UserRole = "system-admin" | "admin" | "developer" | "user" | "viewer";

export interface UserProfile {
    empid: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
    department: string;
    position: string;
    roles: UserRole[];
    credits: number;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfileResponse {
    success: boolean;
    message?: string;
    data: UserProfile;
}
