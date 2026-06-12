export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public url: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

const BASE_URL =
    typeof window === "undefined"
        ? process.env.SERVER_API_BASE_URL || process.env.NEXT_PUBLIC_STORE_API_BASE_URL
        : "/api/library";

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_STORE_API_BASE_URL");
}

const TOKEN_COOKIE_KEY = "zt_token";

export function buildUrl(
    path: string,
    params?: Record<string, string | number | undefined>,
): string {
    const target = `${BASE_URL}${path}`;
    const isAbsolute = /^https?:\/\//i.test(target);
    const url = isAbsolute
        ? new URL(target)
        : new URL(target, "http://local");

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
    }

    if (isAbsolute) {
        return url.toString();
    }

    return `${url.pathname}${url.search}`;
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

export async function getAuthToken(): Promise<string | null> {
    if (typeof window !== "undefined" && BASE_URL?.startsWith("/api/library")) {
        return null;
    }

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

const inflightRequests = new Map<string, Promise<unknown>>();

export interface ApiFetchOptions extends RequestInit {
    silentErrors?: boolean;
}

export async function apiFetch<T>(
    url: string,
    init?: ApiFetchOptions,
): Promise<T> {
    const { silentErrors = false, ...fetchInit } = init || {};
    const method = fetchInit.method?.toUpperCase() ?? "GET";
    const isGet = method === "GET";

    if (isGet) {
        const cachedPromise = inflightRequests.get(url);
        if (cachedPromise) {
            console.log(`[Library API] Reusing in-flight request for: ${url}`);
            return cachedPromise as Promise<T>;
        }
    }

    const promise = (async () => {
        const incomingHeaders = new Headers(fetchInit.headers);

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
        console.log(`[Library API] → ${fetchInit.method ?? "GET"} ${url}`);
        console.log(`[Library API]   Authorization: ${hasAuth ? "Bearer <token>" : "⚠ MISSING (Handled by Proxy)"}`);

        const t0 = Date.now();
        let res: Response;
        try {
            res = await fetch(url, {
                headers: incomingHeaders,
                credentials: "include",
                ...fetchInit,
            });
        } catch (error) {
            const err = error as Error & {
                cause?: { code?: string; errno?: number; syscall?: string; address?: string; port?: number };
            };

            if (!silentErrors) {
                console.error("[Library API] ✗ Network fetch failed", {
                    url,
                    method: fetchInit.method ?? "GET",
                    hasAuth,
                    message: err.message,
                    cause: err.cause,
                });
            }
            throw error;
        }
        console.log(`[Library API] ← ${res.status} ${res.statusText} (${Date.now() - t0}ms)`);

        if (res.status === 401) {
            if (typeof window !== "undefined") {
                window.location.href = "/api/auth/logout";
            }
            throw new ApiError(401, "Unauthorized", url);
        }

        if (!res.ok) {
            let parsedBody: unknown = undefined;
            let bodyText = "";
            try {
                bodyText = await res.text();
                parsedBody = bodyText ? JSON.parse(bodyText) : undefined;
            } catch {
                parsedBody = bodyText || undefined;
            }

            if (bodyText && !silentErrors) {
                console.error(`[Library API] ✗ Error body: ${bodyText.slice(0, 500)}`);
            }

            throw new ApiError(
                res.status,
                `Library API error ${res.status} ${res.statusText}`,
                url,
                parsedBody,
            );
        }

        return res.json() as Promise<T>;
    })();

    if (isGet) {
        inflightRequests.set(url, promise);
        promise.finally(() => {
            inflightRequests.delete(url);
        }).catch(() => {
            // Prevent unhandled promise rejection in the finally chain.
            // The caller gets the original promise and handles the error.
        });
    }

    return promise;
}
