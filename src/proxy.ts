import { type NextRequest, NextResponse } from "next/server";
import { isAllowedHost, isCrossSite } from "./proxy-guards";

// Static asset patterns — skip middleware entirely
const STATIC_PATTERN =
    /^\/(_next\/static|_next\/image|favicon\.ico|images|fonts|robots\.txt|sitemap\.xml)/;

// ─── Trusted sources for CSP ─────────────────────────────────────────────────
// Update these when adding new external resources.

const TRUSTED_CONNECT_SRCS = ["'self'"].join(" ");

const TRUSTED_IMG_SRCS = ["'self'", "data:", "blob:"].join(" ");

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
        "font-src": "'self' https://fonts.gstatic.com",
        "connect-src": TRUSTED_CONNECT_SRCS,
        // Loop Studio embeds a live app preview (iframe) inside the workspace.
        // In DEV only, allow local dev-server ports so the preview pane can render —
        // both what this app may frame (frame-src) and who may frame this app
        // (frame-ancestors), so the Studio can preview a sibling project's dev server
        // running on another localhost port. Production stays locked to 'self'/'none'.
        "frame-src": isProd ? "'self'" : "'self' http://localhost:* http://127.0.0.1:*",
        "frame-ancestors": isProd ? "'none'" : "'self' http://localhost:* http://127.0.0.1:*",
        "form-action": "'self'",
        "base-uri": "'self'",
        "object-src": "'none'",
        "upgrade-insecure-requests": "",
    };

    return Object.entries(directives)
        .map(([key, val]) => (val ? `${key} ${val}` : key))
        .join("; ");
}

// ─── Cross-site request protection ───────────────────────────────────────────
// Loop Studio has no auth, and its API runs real commands and returns data on
// this machine. Without these checks, any website open in the same browser could
// fire requests at localhost:3000 (CSRF) or reach it via DNS rebinding. The pure
// guards live in ./proxy-guards (unit-tested there).

/**
 * Reject requests that don't come from this app's own origin.
 * - Host allowlist defeats DNS rebinding (attacker's domain resolving to 127.0.0.1
 *   still arrives with the attacker's hostname in the Host header).
 * - Cross-site check runs on EVERY method, not just state-changing ones: the
 *   no-auth API returns data (task logs, file contents, directory listings) as
 *   well as running commands, so a cross-site READ is as harmful as a write.
 *   SOP/CORS already stops a browser reading these responses cross-origin; this
 *   rejects the request outright as defense-in-depth.
 * Same-origin requests from the app itself always pass both checks.
 */
function rejectCrossSiteRequest(req: NextRequest): NextResponse | null {
    const host = req.headers.get("host") ?? "";
    if (!isAllowedHost(host)) {
        return new NextResponse(`Blocked: host "${host}" is not allowed. Set LOOP_ALLOWED_HOSTS to permit it.`, {
            status: 403,
        });
    }

    if (isCrossSite(host, req.headers.get("origin"), req.headers.get("sec-fetch-site"))) {
        return new NextResponse("Blocked: cross-site request.", { status: 403 });
    }

    return null;
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

    // Static assets don't need CSP headers or a nonce.
    if (STATIC_PATTERN.test(pathname)) {
        return NextResponse.next();
    }

    // No auth gate — Loop Studio has no auth system — but cross-site requests
    // are rejected so other websites/hosts can't drive the local API.
    const blocked = rejectCrossSiteRequest(req);
    if (blocked) {
        return blocked;
    }

    // Generate a fresh cryptographic nonce for every request.
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    return applySecurityHeaders(NextResponse.next(), nonce);
}

export const config = {
    // Run on all routes except Next.js internals and static files
    matcher: ["/((?!_next/static|_next/image|favicon\.ico).*)"],
};
