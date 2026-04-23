import type {
    GetAppsParams,
    GetAppsResponse,
    GetBannersParams,
    GetBannersResponse,
} from "@/core/interfaces/store.interface";

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

function getClientZtToken(): string | null {
    const fromCookie = readBrowserCookie(TOKEN_COOKIE_KEY);
    if (fromCookie) return fromCookie;

    if (typeof window !== "undefined") {
        return window.localStorage.getItem(TOKEN_COOKIE_KEY);
    }

    return null;
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
        const token = getClientZtToken();
        if (token) {
            incomingHeaders.set("Authorization", `Bearer ${token}`);
        }
    }

    if (!incomingHeaders.has("Content-Type")) {
        incomingHeaders.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
        headers: incomingHeaders,
        credentials: "include",
        ...init,
    });

    if (res.status === 401) {
        // Token expired or revoked — clear and bounce to login (client-side only)
        if (typeof document !== "undefined") {
            document.cookie = `${TOKEN_COOKIE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        }
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(TOKEN_COOKIE_KEY);
            window.location.href = "/login";
        }
        throw new ApiError(401, "Unauthorized", url);
    }

    if (!res.ok) {
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
 * GET /library/apps
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
    const url = buildUrl("/library/apps", {
        page: params.page,
        limit: params.limit,
        category: params.category,
    });

    return apiFetch<GetAppsResponse>(url, init);
}

// ─── Banners ──────────────────────────────────────────────────────────────────

/**
 * GET /library/banners
 *
 * @example
 * // first 3 banners
 * getBanners({ page: 1, limit: 3 })
 */
export async function getBanners(
    params: GetBannersParams = {},
    init?: RequestInit,
): Promise<GetBannersResponse> {
    const url = buildUrl("/library/banners", {
        page: params.page,
        limit: params.limit,
    });

    return apiFetch<GetBannersResponse>(url, init);
}
