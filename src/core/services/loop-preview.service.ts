// Server-side runner for the Preview pane's API console. The browser can't call a
// project's backend directly (cross-origin, and local mock servers rarely send
// CORS headers), so the console posts here and the server forwards the request.
// Constrained to localhost targets so this can't be used as an open proxy (SSRF).
import path from "path";
import { readJsonStore, writeJsonStore, assertSafeStoreId } from "./json-store";

export interface ApiRequestInput {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
}

export interface ApiRequestResult {
    status: number;
    statusText: string;
    ok: boolean;
    timeMs: number;
    size: number;
    contentType: string;
    body: string;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"]);

/** Only allow http(s) requests to a loopback host — this is a local dev tool, not a proxy. */
export function isLocalUrl(raw: string): boolean {
    try {
        const u = new URL(raw);
        if (u.protocol !== "http:" && u.protocol !== "https:") return false;
        return LOCAL_HOSTS.has(u.hostname) || u.hostname.endsWith(".localhost");
    } catch {
        return false;
    }
}

export async function runApiRequest(input: ApiRequestInput): Promise<ApiRequestResult> {
    const started = Date.now();
    const noBody = input.method === "GET" || input.method === "HEAD";
    // Timeout so a hung backend can't stall the console (or a pipeline that runs checks).
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
        const res = await fetch(input.url, {
            method: input.method,
            headers: input.headers,
            body: noBody ? undefined : input.body,
            redirect: "manual",
            signal: controller.signal,
        });
        const text = await res.text();
        return {
            status: res.status,
            statusText: res.statusText,
            ok: res.ok,
            timeMs: Date.now() - started,
            size: new TextEncoder().encode(text).length,
            contentType: res.headers.get("content-type") || "",
            body: text,
        };
    } finally {
        clearTimeout(timer);
    }
}

// ---- saved API checks (persisted per project under .antigravity) ----

export interface ApiCheck {
    id: string;
    name: string;
    method: string;
    url: string;
    body?: string;
    createdAt: string;
}
export interface CheckResult {
    id: string;
    name: string;
    method: string;
    url: string;
    ok: boolean;
    status: number;
    timeMs: number;
    error?: string;
}

function checksPath(projectId: string): string {
    return path.join(process.cwd(), ".antigravity", `api-checks-${assertSafeStoreId(projectId)}.json`);
}

export function getApiChecks(projectId: string): ApiCheck[] {
    return readJsonStore<ApiCheck[]>(checksPath(projectId), []);
}

export function saveApiCheck(projectId: string, check: ApiCheck): ApiCheck[] {
    const list = [...getApiChecks(projectId), check];
    writeJsonStore(checksPath(projectId), list);
    return list;
}

export function deleteApiCheck(projectId: string, id: string): ApiCheck[] {
    const list = getApiChecks(projectId).filter((c) => c.id !== id);
    writeJsonStore(checksPath(projectId), list);
    return list;
}

/** Run every saved check for a project; a check passes on a 2xx response. */
export async function runApiChecks(projectId: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    for (const c of getApiChecks(projectId)) {
        const base = { id: c.id, name: c.name, method: c.method, url: c.url };
        if (!isLocalUrl(c.url)) {
            results.push({ ...base, ok: false, status: 0, timeMs: 0, error: "non-localhost target" });
            continue;
        }
        try {
            const r = await runApiRequest({
                url: c.url,
                method: c.method,
                body: c.body,
                headers: c.body ? { "Content-Type": "application/json" } : undefined,
            });
            results.push({ ...base, ok: r.ok, status: r.status, timeMs: r.timeMs });
        } catch (e) {
            results.push({ ...base, ok: false, status: 0, timeMs: 0, error: e instanceof Error ? e.message : "failed" });
        }
    }
    return results;
}
