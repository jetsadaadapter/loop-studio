import type {
    GetAppsParams,
    GetAppsResponse,
    GetBannersParams,
    GetBannersResponse,
} from "@/core/interfaces/store.interface";

// ─────────────────────────────────────────────────────────────────────────────
// Store API service
// Base URL: https://store-api.adapterdigital.com/api
//
// All functions are thin fetch wrappers — no caching strategy is assumed here.
// Callers control revalidation via Next.js fetch options or SWR/React Query.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "https://store-api.adapterdigital.com/api";

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
        // Token expired or revoked — clear and bounce to login
        if (typeof document !== "undefined") {
            document.cookie = `${TOKEN_COOKIE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        }
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(TOKEN_COOKIE_KEY);
            window.location.href = "/login";
        }
        throw new Error(`Store API error 401 Unauthorized — ${url}`);
    }

    if (!res.ok) {
        throw new Error(
            `Store API error ${res.status} ${res.statusText} — ${url}`,
        );
    }

    return res.json() as Promise<T>;
}

// ─── Apps ─────────────────────────────────────────────────────────────────────

/**
 * GET /store/apps
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
    const url = buildUrl("/store/apps", {
        page: params.page,
        limit: params.limit,
        category: params.category,
    });

    return apiFetch<GetAppsResponse>(url, init);
}

// ─── Banners ──────────────────────────────────────────────────────────────────

/**
 * GET /store/banners
 *
 * @example
 * // first 3 banners
 * getBanners({ page: 1, limit: 3 })
 */
export async function getBanners(
    params: GetBannersParams = {},
    init?: RequestInit,
): Promise<GetBannersResponse> {
    const url = buildUrl("/store/banners", {
        page: params.page,
        limit: params.limit,
    });

    return apiFetch<GetBannersResponse>(url, init);
}
