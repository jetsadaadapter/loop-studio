import type {
    GetAppsParams,
    GetAppsResponse,
    GetBannersParams,
    GetBannersResponse,
    LibraryAppApiItem,
} from "@/core/interfaces/library.interface";
import { slugifyAppName } from "@/app/library/apps/data";

// ─────────────────────────────────────────────────────────────────────────────
// Library API service
// Base URL: https://library-api.adapterdigital.com/api
//
// All functions are thin fetch wrappers — no caching strategy is assumed here.
// Callers control revalidation via Next.js fetch options or SWR/React Query.
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public url: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

const BASE_URL = process.env.NEXT_PUBLIC_STORE_API_BASE_URL;

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_STORE_API_BASE_URL");
}

const TOKEN_COOKIE_KEY = "zt_token";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build URL with type-safe query params.
 * Omits undefined values so the server never receives empty strings.
 */
function buildUrl(
    path: string,
    params?: Record<string, string | number | undefined>,
): string {
    const url = new URL(`${BASE_URL}${path}`);

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
    }

    return url.toString();
}

function readBrowserCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const all = document.cookie ? document.cookie.split(";") : [];
    const prefix = `${name}=`;

    for (const raw of all) {
        const cookie = raw.trim();
        if (cookie.startsWith(prefix)) {
            return decodeURIComponent(cookie.slice(prefix.length));
        }
    }

    return null;
}

async function getAuthToken(): Promise<string | null> {
    if (typeof window !== "undefined") {
        const token = readBrowserCookie(TOKEN_COOKIE_KEY);
        console.log(`[Library API] Browser token: ${token ? "✓ Found" : "✗ Missing"}`);
        return token;
    }

    try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get(TOKEN_COOKIE_KEY)?.value || null;
        console.log(`[Library API] Server token: ${token ? "✓ Found" : "✗ Missing"}`);
        return token;
    } catch (err) {
        console.error("[Library API] Failed to read auth token:", err);
        return null;
    }
}

/**
 * Shared fetch wrapper — throws a typed Error on non-2xx responses
 * so callers can catch and surface meaningful messages.
 */
async function apiFetch<T>(
    url: string,
    init?: RequestInit,
): Promise<T> {
    const incomingHeaders = new Headers(init?.headers);

    if (!incomingHeaders.has("Authorization")) {
        const token = await getAuthToken();
        if (token) {
            incomingHeaders.set("Authorization", `Bearer ${token}`);
        }
    }

    if (!incomingHeaders.has("Content-Type")) {
        incomingHeaders.set("Content-Type", "application/json");
    }

    const hasAuth = incomingHeaders.has("Authorization");
    console.log(`[Library API] → ${init?.method ?? "GET"} ${url}`);
    console.log(`[Library API]   Authorization: ${hasAuth ? "Bearer <token>" : "⚠ MISSING"}`);

    const t0 = Date.now();
    let res: Response;
    try {
        res = await fetch(url, {
            headers: incomingHeaders,
            credentials: "include",
            ...init,
        });
    } catch (error) {
        const err = error as Error & {
            cause?: { code?: string; errno?: number; syscall?: string; address?: string; port?: number };
        };

        console.error("[Library API] ✗ Network fetch failed", {
            url,
            method: init?.method ?? "GET",
            hasAuth,
            message: err.message,
            cause: err.cause,
        });
        throw error;
    }
    console.log(`[Library API] ← ${res.status} ${res.statusText} (${Date.now() - t0}ms)`);

    if (res.status === 401) {
        // Token expired or revoked — bounce to login (client-side only).
        // Server-side errors will throw and be caught by the page/component to redirect to /api/auth/logout
        if (typeof window !== "undefined") {
            window.location.href = "/api/auth/logout";
        }
        throw new ApiError(401, "Unauthorized", url);
    }

    if (!res.ok) {
        let body = "";
        try { body = await res.text(); } catch { /* ignore */ }
        console.error(`[Library API] ✗ Error body: ${body.slice(0, 500)}`);
        throw new ApiError(
            res.status,
            `Library API error ${res.status} ${res.statusText}`,
            url,
        );
    }

    return res.json() as Promise<T>;
}

// ─── Apps ─────────────────────────────────────────────────────────────────────

/**
 * GET /apps
 *
 * @example
 * // page 1, limit 10, all categories
 * getApps()
 *
 * // page 2, limit 5
 * getApps({ page: 2, limit: 5 })
 *
 * // MCP only
 * getApps({ category: "MCP" })
 *
 * // MCP, page 1, limit 5
 * getApps({ category: "MCP", page: 1, limit: 5 })
 */
export async function getApps(
    params: GetAppsParams = {},
    init?: RequestInit,
): Promise<GetAppsResponse> {
    const url = buildUrl("/apps", {
        page: params.page,
        limit: params.limit,
        category: params.category,
    });

    console.log(`[Library API] Fetching apps from: ${url}`);
    try {
        const response = await apiFetch<GetAppsResponse>(url, init);
        console.log(`[Library API] ✓ Fetch successful. Received ${response.data.length} groups`);
        return response;
    } catch (error) {
        console.error("[Library API] ✗ Fetch failed:", error instanceof Error ? error.message : error);
        throw error;
    }
}

/**
 * Fetch all apps and find the one matching the given slug.
 */
export async function getAppBySlug(
    slug: string,
    init?: RequestInit,
): Promise<LibraryAppApiItem | null> {
    try {
        const response = await getApps({ page: 1, limit: 100 }, init);
        const allApps = response.data.flatMap((group) => group.items);
        return allApps.find((item) => slugifyAppName(item.name) === slug) || null;
    } catch (error) {
        console.error(`Failed to fetch app by slug: ${slug}`, error);
        return null;
    }
}

/**
 * Fetch related apps by category, excluding the current app.
 */
export async function getRelatedApps(
    appId: string,
    category: string,
    init?: RequestInit,
): Promise<LibraryAppApiItem[]> {
    try {
        const response = await getApps({ page: 1, limit: 100 }, init);
        const allApps = response.data.flatMap((group) => group.items);
        return allApps
            .filter((item) => item.appId !== appId && item.category === category)
            .slice(0, 3);
    } catch (error) {
        console.error(`Failed to fetch related apps for ${appId}`, error);
        return [];
    }
}

// ─── Banners ──────────────────────────────────────────────────────────────────

/**
 * GET /banners
 *
 * @example
 * // first 3 banners
 * getBanners({ page: 1, limit: 3 })
 */
export async function getBanners(
    params: GetBannersParams = {},
    init?: RequestInit,
): Promise<GetBannersResponse> {
    const url = buildUrl("/banners", {
        page: params.page,
        limit: params.limit,
    });

    return apiFetch<GetBannersResponse>(url, init);
}
