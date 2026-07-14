"use client";

// The Preview pane's "API" mode: a request builder + response viewer for projects
// whose target is a backend. Import a Postman collection for a searchable endpoint
// rail; edit {{env}} vars; save requests as re-runnable checks. Every request goes
// through /api/loop-projects/[id]/api-request so the browser never hits the backend
// cross-origin (avoids CORS; server enforces localhost-only). History persists per
// project in localStorage.
import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { parsePostman, applyVars, type EndpointGroup, type ApiEndpoint } from "./postman";
import { ApiEndpointRail } from "./ApiEndpointRail";
import { ApiToolbar } from "./ApiToolbar";
import { ApiHistoryPanel } from "./ApiHistoryPanel";
import { ApiChecksPanel } from "./ApiChecksPanel";
import { ApiResponseView, type ApiResponse } from "./ApiResponseView";
import { loadHistory, pushHistory, clearHistory, type HistoryEntry } from "./apiHistory";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = (typeof METHODS)[number];
type Panel = "main" | "history" | "checks";

export function ApiConsole({ baseUrl, projectId }: { baseUrl: string; projectId: string }) {
    const [method, setMethod] = useState<Method>("GET");
    const [path, setPath] = useState("/");
    const [reqBody, setReqBody] = useState("");
    const [loading, setLoading] = useState(false);
    const [res, setRes] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [collection, setCollection] = useState<{ name: string; groups: EndpointGroup[] } | null>(null);
    const [env, setEnv] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [panel, setPanel] = useState<Panel>("main");
    const [now, setNow] = useState(0);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(loadHistory(projectId));
    }, [projectId]);

    const base = baseUrl.replace(/\/+$/, "");
    const resolvedPath = applyVars(path.startsWith("/") ? path : `/${path}`, env);
    const fullUrl = base + resolvedPath;
    const hasBody = method !== "GET";
    const endpointCount = collection?.groups.reduce((n, g) => n + g.endpoints.length, 0) ?? 0;

    async function importFile(file: File) {
        setError(null);
        try {
            const parsed = parsePostman(JSON.parse(await file.text()));
            setCollection({ name: parsed.name, groups: parsed.groups });
            setEnv(parsed.variables);
            setSearch("");
        } catch (e) {
            setError(e instanceof Error ? e.message : "อ่านไฟล์ไม่สำเร็จ");
        }
    }

    function fillFrom(m: string, p: string, b: string) {
        setMethod((METHODS as readonly string[]).includes(m) ? (m as Method) : "GET");
        setPath(p);
        setReqBody(b);
        setPanel("main");
        setRes(null);
        setError(null);
    }

    async function saveCheck() {
        try {
            await fetch(`/api/loop-projects/${projectId}/api-checks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${method} ${resolvedPath}`,
                    method,
                    url: fullUrl,
                    body: hasBody && reqBody.trim() ? applyVars(reqBody, env) : undefined,
                }),
            });
            setPanel("checks");
        } catch {
            setError("บันทึก check ไม่สำเร็จ");
        }
    }

    async function send() {
        setLoading(true);
        setError(null);
        setPanel("main");
        try {
            const payload: Record<string, unknown> = { url: fullUrl, method };
            if (hasBody && reqBody.trim()) {
                payload.body = applyVars(reqBody, env);
                payload.headers = { "Content-Type": "application/json" };
            }
            const r = await fetch(`/api/loop-projects/${projectId}/api-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await r.json();
            const d: ApiResponse | null = json.success ? (json.data as ApiResponse) : null;
            if (!json.success) {
                setError(json.error || "Request failed");
                setRes(null);
            } else {
                setRes(d);
            }
            setHistory(
                pushHistory(projectId, {
                    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    method,
                    path,
                    body: hasBody && reqBody.trim() ? reqBody : undefined,
                    status: d?.status ?? 0,
                    ok: d?.ok ?? false,
                    timeMs: d?.timeMs ?? 0,
                    at: Date.now(),
                }),
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : "Network error");
            setRes(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-1 min-h-0 flex-col bg-slate-50">
            <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importFile(f);
                    e.target.value = "";
                }}
            />

            <ApiToolbar
                collectionName={collection?.name}
                endpointCount={endpointCount}
                historyCount={history.length}
                panel={panel}
                onHistory={() => {
                    setNow(Date.now());
                    setPanel((p) => (p === "history" ? "main" : "history"));
                }}
                onChecks={() => setPanel((p) => (p === "checks" ? "main" : "checks"))}
                onImport={() => fileRef.current?.click()}
                onClearCollection={() => {
                    setCollection(null);
                    setEnv({});
                    setSelectedId(null);
                }}
                onSaveCheck={saveCheck}
            />

            {Object.keys(env).length > 0 && (
                <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Env</span>
                    {Object.entries(env).map(([k, v]) => (
                        <label key={k} className="flex shrink-0 items-center gap-1">
                            <span className="text-[11px] font-semibold font-sans text-indigo-600">{`{{${k}}}`}</span>
                            <input
                                value={v}
                                onChange={(e) => setEnv((prev) => ({ ...prev, [k]: e.target.value }))}
                                spellCheck={false}
                                className="h-6 w-40 rounded-sm border border-slate-200 bg-white px-2 text-[11px] font-sans text-slate-700 focus:border-indigo-500 focus:outline-none"
                            />
                        </label>
                    ))}
                </div>
            )}

            <div className="flex min-h-0 flex-1">
                {collection ? (
                    <ApiEndpointRail
                        groups={collection.groups}
                        search={search}
                        onSearch={setSearch}
                        onSelect={(e: ApiEndpoint) => {
                            setSelectedId(e.id);
                            fillFrom(e.method, e.path, e.rawBody ?? "");
                        }}
                        selectedId={selectedId}
                    />
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
                        <div className="flex items-center overflow-hidden rounded-sm border border-slate-200">
                            {METHODS.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={`cursor-pointer px-2.5 py-1 text-[11px] font-semibold font-sans transition-colors ${
                                        method === m ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <input
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            spellCheck={false}
                            placeholder="/api/rewards"
                            className="h-7 flex-1 rounded-sm border border-slate-200 bg-slate-50 px-2.5 text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={send}
                            disabled={loading}
                            className="flex h-7 cursor-pointer items-center gap-1.5 rounded-sm bg-indigo-600 px-3 text-xs font-semibold font-sans text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />} Send
                        </button>
                    </div>

                    <div className="shrink-0 truncate border-b border-slate-100 bg-white px-3 py-1 text-[10px] font-sans text-slate-400">
                        {method} <span className="text-slate-500">{fullUrl}</span>
                    </div>

                    {hasBody && (
                        <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">Request body (JSON)</div>
                            <textarea
                                value={reqBody}
                                onChange={(e) => setReqBody(e.target.value)}
                                rows={4}
                                spellCheck={false}
                                placeholder={'{\n  "line_user_id": "U1234567890abcdef"\n}'}
                                className="w-full rounded-sm border border-slate-700 bg-slate-950 p-2 text-[11px] leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                            />
                        </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-auto">
                        {panel === "checks" ? (
                            <ApiChecksPanel projectId={projectId} />
                        ) : panel === "history" ? (
                            <ApiHistoryPanel
                                entries={history}
                                now={now}
                                onReplay={(e) => fillFrom(e.method, e.path, e.body ?? "")}
                                onClear={() => {
                                    clearHistory(projectId);
                                    setHistory([]);
                                }}
                            />
                        ) : error ? (
                            <div className="m-3 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-sans">{error}</div>
                        ) : !res ? (
                            <div className="flex h-full items-center justify-center px-6 text-center text-xs text-slate-400 font-sans">
                                {collection
                                    ? "เลือก endpoint จากด้านซ้าย หรือพิมพ์ path เอง แล้วกด Send"
                                    : "Import Postman หรือพิมพ์ method + path เอง แล้วกด Send — request ยิงผ่าน Loop Studio (เลี่ยง CORS)"}
                            </div>
                        ) : (
                            <ApiResponseView res={res} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
