"use client";

// Left rail for the API console: searchable, grouped endpoint list parsed from an
// imported Postman collection. Clicking an endpoint fills the request builder.
import type { EndpointGroup, ApiEndpoint } from "./postman";

const METHOD_COLOR: Record<string, string> = {
    GET: "text-indigo-600",
    POST: "text-emerald-600",
    PUT: "text-amber-600",
    PATCH: "text-violet-600",
    DELETE: "text-red-600",
};

export function ApiEndpointRail({
    groups,
    search,
    onSearch,
    onSelect,
    selectedId,
}: {
    groups: EndpointGroup[];
    search: string;
    onSearch: (s: string) => void;
    onSelect: (e: ApiEndpoint) => void;
    selectedId: string | null;
}) {
    const q = search.trim().toLowerCase();
    const filtered = groups
        .map((g) => ({
            ...g,
            endpoints: g.endpoints.filter((e) => !q || `${e.method} ${e.path} ${e.name}`.toLowerCase().includes(q)),
        }))
        .filter((g) => g.endpoints.length > 0);

    return (
        <div className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
            <div className="shrink-0 p-2">
                <input
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="ค้นหา endpoint…"
                    spellCheck={false}
                    className="h-7 w-full rounded-sm border border-slate-200 bg-white px-2.5 text-[11px] font-sans text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
            </div>
            <div className="min-h-0 flex-1 overflow-auto pb-2">
                {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[11px] font-sans text-slate-400">ไม่พบ endpoint</div>
                ) : (
                    filtered.map((g) => (
                        <div key={g.name}>
                            <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">
                                {g.name}
                            </div>
                            {g.endpoints.map((e) => (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => onSelect(e)}
                                    title={e.name}
                                    className={`flex w-full cursor-pointer items-center gap-2 border-l-2 px-3 py-1.5 text-left transition-colors ${
                                        selectedId === e.id ? "border-indigo-500 bg-white" : "border-transparent hover:bg-white/70"
                                    }`}
                                >
                                    <span className={`w-9 shrink-0 text-[9px] font-bold font-sans ${METHOD_COLOR[e.method] || "text-slate-500"}`}>
                                        {e.method}
                                    </span>
                                    <span className="truncate text-[11px] font-sans text-slate-700">{e.path}</span>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
