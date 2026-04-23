import { type NextRequest, NextResponse } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
    "/login",
    "/callback",
    "/api/auth",
];

// Static asset patterns — skip middleware entirely
const STATIC_PATTERN =
    /^\/(_next\/static|_next\/image|favicon\.ico|images|fonts|login-adapterstore)/;

const TOKEN_COOKIE = "zt_token";

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow static assets through unconditionally
    if (STATIC_PATTERN.test(pathname)) {
        return NextResponse.next();
    }

    // Check for zt_token cookie
    const token = req.cookies.get(TOKEN_COOKIE)?.value;

    // Prevent logged-in users from returning to login page
    if (pathname === "/login" && token) {
        return NextResponse.redirect(new URL("/apps", req.url));
    }

    // Allow public paths through
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    if (!token) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        // Preserve the original destination so we can redirect back after login
        loginUrl.searchParams.set("returnTo", pathname);
        loginUrl.search = ""; // strip returnTo for now — login button handles returnTo via sessionStorage
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Run on all routes except Next.js internals and static files
    matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
