import { type NextRequest, NextResponse } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
    "/login",
    "/callback",
    "/api/auth",
    "/docs/openapi.json",
    // Dev-only component gallery used by Playwright visual-regression tests.
    // Never public in production: the entry is only added when not prod, and the
    // page itself also calls notFound() under NODE_ENV === "production".
    ...(process.env.NODE_ENV !== "production" ? ["/dev"] : []),
];

// Static asset patterns — skip middleware entirely
const STATIC_PATTERN =
    /^\/(_next\/static|_next\/image|favicon\.ico|images|fonts|login-adapterstore|robots\.txt|sitemap\.xml)/;

const TOKEN_COOKIE = "zt_token";

// ─── Trusted sources for CSP ─────────────────────────────────────────────────
// Update these when adding new external resources.

const TRUSTED_CONNECT_SRCS = [
    "'self'",
    "https://auth.adapterinternal.com",
    "https://library-api.adapterdigital.com",
    // Scalar API Reference — registry, search, and proxy endpoints
    "https://api.scalar.com",
    "https://proxy.scalar.com",
].join(" ");

const TRUSTED_IMG_SRCS = [
    "'self'",
    "data:",
    "blob:",
    "https://*.adapterdigital.com",
    "https://*.googleusercontent.com",
    "https://*.google.com",
    "https://images.unsplash.com",
    "https://source.unsplash.com",
    "https://ui-avatars.com",
    "https://placehold.co",
    "https://*.fbcdn.net",
    "https://*.facebook.com",
    "https://*.akamaihd.net",
].join(" ");

/**
 * Build a strict Content-Security-Policy header value using a per-request nonce.
 *
 * Using a nonce is the correct way to allow Next.js inline scripts (hydration,
 * HMR) while keeping a strict CSP without needing unsafe-inline globally.
 * Next.js automatically picks up the nonce via the x-nonce response header.
 */
function buildCsp(nonce: string): string {
    const isProd = process.env.NODE_ENV === "production";

    // 'strict-dynamic' lets scripts loaded by a nonced script load further scripts
    // without needing individual hashes/nonces (required for Next.js chunk loading).
    const scriptSrc = [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        // React requires eval() in dev for call stack reconstruction & HMR.
        // Never present in production builds.
        ...(!isProd ? ["'unsafe-eval'"] : []),
    ].join(" ");

    const directives: Record<string, string> = {
        "default-src": "'self'",
        "script-src": scriptSrc,
        "style-src": "'self' 'unsafe-inline'",
        "img-src": TRUSTED_IMG_SRCS,
        "font-src": "'self' https://fonts.scalar.com https://fonts.gstatic.com",
        "connect-src": TRUSTED_CONNECT_SRCS,
        // Loop Studio embeds a live app preview (iframe) inside the workspace.
        // In DEV only, allow same-origin framing plus local dev-server ports so the
        // preview pane can render. Production stays locked to 'self'/'none'.
        "frame-src": isProd ? "'self'" : "'self' http://localhost:* http://127.0.0.1:*",
        "frame-ancestors": isProd ? "'none'" : "'self'",
        "form-action": "'self'",
        "base-uri": "'self'",
        "object-src": "'none'",
        "upgrade-insecure-requests": "",
        "report-uri": "/api/csp-violation-report",
    };

    return Object.entries(directives)
        .map(([key, val]) => (val ? `${key} ${val}` : key))
        .join("; ");
}

/** Attach security response headers to any NextResponse. */
function applySecurityHeaders(res: NextResponse, nonce: string): NextResponse {
    res.headers.set("Content-Security-Policy", buildCsp(nonce));
    // x-nonce is read by layout.tsx and passed to Next.js for inline script stamping
    res.headers.set("x-nonce", nonce);
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
    );
    return res;
}

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Generate a fresh cryptographic nonce for every request
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

    // Allow static assets through unconditionally
    if (STATIC_PATTERN.test(pathname)) {
        return applySecurityHeaders(NextResponse.next(), nonce);
    }

    // Check for zt_token cookie
    const token = req.cookies.get(TOKEN_COOKIE)?.value;

    // Prevent logged-in users from returning to login page
    if (pathname === "/login" && token) {
        return applySecurityHeaders(
            NextResponse.redirect(new URL("/apps", req.url)),
            nonce,
        );
    }

    // Allow public paths through
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return applySecurityHeaders(NextResponse.next(), nonce);
    }

    if (!token) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = ""; // login button handles returnTo via sessionStorage
        return applySecurityHeaders(NextResponse.redirect(loginUrl), nonce);
    }

    return applySecurityHeaders(NextResponse.next(), nonce);
}

export const config = {
    // Run on all routes except Next.js internals and static files
    matcher: ["/((?!_next/static|_next/image|favicon\.ico).*)"],
};
