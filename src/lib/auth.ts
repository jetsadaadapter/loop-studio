import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "@company.com";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            // Domain restriction — only allow company emails
            return user.email?.endsWith(ALLOWED_DOMAIN) ?? false;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = "user" as const; // TODO: resolve role from Centralized MCP Auth token
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as typeof session.user & { role: "admin" | "user" | "viewer" }).role =
                    token.role as "admin" | "user" | "viewer";
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60, // 1 hour — short-lived
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
            options: {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax" as const,
            },
        },
    },
};
