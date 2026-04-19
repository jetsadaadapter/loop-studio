import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const isAuthBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_BYPASS !== "false";

export default withAuth(
    function middleware(req) {
        if (isAuthBypassEnabled) {
            return NextResponse.next();
        }

        const pathname = req.nextUrl.pathname;

        // Skip NextAuth endpoints and static assets.
        if (
            pathname.startsWith("/api/auth") ||
            pathname.startsWith("/images") ||
            pathname.startsWith("/fonts") ||
            /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/.test(pathname)
        ) {
            return NextResponse.next();
        }

        const { token } = req.nextauth;

        // All /api and private routes require authentication
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => isAuthBypassEnabled || !!token,
        },
    }
);

export const config = {
    matcher: [
        "/api/:path*",
        "/((?!login|_next/static|_next/image|favicon.ico|images|fonts).*)",
    ],
};
