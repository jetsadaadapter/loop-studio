// Pure cross-site request guards used by the proxy middleware (src/proxy.ts).
// Kept in a plain module (not the middleware file) so they can be unit-tested
// and so the middleware entry stays limited to its `proxy`/`config` exports.
//
// Loop Studio has no auth, and its API both runs real commands and returns data
// (task logs, file contents, directory listings). Without these checks any
// website open in the same browser could drive the local API (CSRF) or reach it
// via DNS rebinding — and a cross-site READ is as harmful as a cross-site write.

// Hostnames this app may be addressed by. Extend via LOOP_ALLOWED_HOSTS
// (comma-separated, e.g. "192.168.1.20,mymac.local") for LAN access.
const ALLOWED_HOSTNAMES = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
    ...(process.env.LOOP_ALLOWED_HOSTS?.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean) ?? []),
]);

/** Is the Host header one this app may be addressed by? Port is ignored. */
export function isAllowedHost(host: string): boolean {
    return ALLOWED_HOSTNAMES.has(host.replace(/:\d+$/, "").toLowerCase());
}

/**
 * Does this request originate from a different site than the app itself?
 * - An Origin header that doesn't match the Host means another origin drove the
 *   request. Origin: null (sandboxed iframe, some redirects) fails to parse and
 *   is treated as cross-site too.
 * - Fetch-metadata (`Sec-Fetch-Site`) catches cross-site requests modern browsers
 *   tag even when no Origin is sent. Its ABSENCE is not treated as cross-site
 *   (older browsers, curl, top-level navigations), so legitimate use isn't blocked.
 */
export function isCrossSite(host: string, origin: string | null, secFetchSite: string | null): boolean {
    if (origin) {
        let originHost: string | null = null;
        try {
            originHost = new URL(origin).host;
        } catch {
            originHost = null;
        }
        if (originHost !== host) return true;
    }
    return secFetchSite === "cross-site" || secFetchSite === "cross-origin";
}
