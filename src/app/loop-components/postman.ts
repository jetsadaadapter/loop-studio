// Minimal Postman v2.1 collection parser for the API console's endpoint rail.
// Flattens folders into groups and keeps {{variables}} in paths so the env editor
// can resolve them at send time (via applyVars). {{baseUrl}} is dropped — the
// console supplies the base URL itself.

export interface ApiEndpoint {
    id: string;
    name: string;
    method: string;
    path: string;
    rawBody?: string;
    group: string;
}
export interface EndpointGroup {
    name: string;
    endpoints: ApiEndpoint[];
}
export interface ParsedCollection {
    name: string;
    groups: EndpointGroup[];
    variables: Record<string, string>;
}

/** Resolve {{key}} against an env map; unknown vars are left as-is so they stay visible. */
export function applyVars(s: string, env: Record<string, string>): string {
    return s.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => env[k] ?? `{{${k}}}`);
}

function toPath(url: unknown): string {
    if (!url) return "/";
    if (typeof url === "string") {
        const cleaned = url.replace(/^\{\{baseUrl\}\}/, "").replace(/^https?:\/\/[^/]+/, "");
        return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
    }
    const u = url as { raw?: string; path?: unknown[] };
    if (Array.isArray(u.path)) {
        const parts = u.path.map((p) => (typeof p === "object" && p ? String((p as { value?: string }).value ?? "") : String(p)));
        return "/" + parts.filter(Boolean).join("/");
    }
    if (typeof u.raw === "string") return toPath(u.raw);
    return "/";
}

interface PmItem {
    name?: string;
    item?: PmItem[];
    request?: { method?: string; url?: unknown; body?: { mode?: string; raw?: string } };
}

function groupFor(out: EndpointGroup[], name: string): EndpointGroup {
    let g = out.find((x) => x.name === name);
    if (!g) {
        g = { name, endpoints: [] };
        out.push(g);
    }
    return g;
}

function walk(items: PmItem[], group: string, out: EndpointGroup[], idc: { n: number }) {
    for (const it of items) {
        if (Array.isArray(it.item)) {
            walk(it.item, it.name || group, out, idc);
        } else if (it.request) {
            groupFor(out, group).endpoints.push({
                id: `ep-${idc.n++}`,
                name: it.name || "request",
                method: (it.request.method || "GET").toUpperCase(),
                path: toPath(it.request.url),
                rawBody: it.request.body?.mode === "raw" ? it.request.body.raw : undefined,
                group,
            });
        }
    }
}

export function parsePostman(raw: unknown): ParsedCollection {
    const c = raw as { info?: { name?: string }; item?: PmItem[]; variable?: { key?: string; value?: string }[] };
    if (!c || !Array.isArray(c.item)) throw new Error("ไม่ใช่ Postman collection ที่ถูกต้อง (ไม่มี item)");
    const variables: Record<string, string> = {};
    for (const v of c.variable || []) if (v.key && v.key !== "baseUrl") variables[v.key] = v.value ?? "";
    const groups: EndpointGroup[] = [];
    walk(c.item, c.info?.name || "Endpoints", groups, { n: 0 });
    if (groups.every((g) => g.endpoints.length === 0)) throw new Error("ไม่พบ endpoint ใน collection");
    return { name: c.info?.name || "Collection", groups, variables };
}
