import "next-auth";
import "next-auth/jwt";
import type { UserRole } from "@/core/interfaces/auth.interface";

declare module "next-auth" {
    interface Session {
        user: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: UserRole;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: UserRole;
    }
}
