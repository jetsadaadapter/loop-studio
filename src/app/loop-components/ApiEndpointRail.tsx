"use client";

// Left rail for the API console: filter-pill group tabs + search over an endpoint
// list parsed from an imported Postman collection. Clicking an endpoint fills the
// request builder.
import { useState } from "react";
import { Search } from "lucide-react";
import type { EndpointGroup, ApiEndpoint } from "./postman";

const METHOD_STYLE: Record<string, string> = {
    GET: "bg-indigo-50 text-indigo-700",
    POST: "bg-emerald-50 text-emerald-700",
    PUT: "bg-amber-50 text-amber-700",
    PATCH: "bg-violet-50 text-violet-700",
    DELETE: "bg-red-50 text-red-700",
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
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    // Guards against a stale filter surviving a collection swap: if the
    // previously selected group name doesn't exist in the current collection's
    // groups (e.g. after importing a different Postman file), fall back to "All"
    // instead of silently filtering the whole list down to nothing.
    const selectedGroup = activeGroup && groups.some((g) => g.name === activeGroup) ? activeGroup : null;

    const q = search.trim().toLowerCase();
    const filtered = groups
        .map((g) => ({
            ...g,
            endpoints: g.endpoints.filter(
                (e) => (!selectedGroup || g.name === selectedGroup) && (!q || `${e.method} ${e.path} ${e.name}`.toLowerCase().includes(q)),
            ),
        }))
        .filter((g) => g.endpoints.length > 0);

    return (
        // Keep at w-56 (224px) — w-60 was tried and reverted: at a realistic
        // 1440px window with the chat panel open, the extra 16px was enough to
        // clip the request-builder's method segmented control ("DELETE" → "DELE").
        <div className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto px-2 pt-2 pb-1.5">
                <button
                    type="button"
                    onClick={() => setActiveGroup(null)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold font-sans transition-colors cursor-pointer ${
                        selectedGroup === null ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                >
                    All
                </button>
                {groups.map((g) => (
                    <button
                        key={g.name}
                        type="button"
                        onClick={() => setActiveGroup(g.name)}
                        className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold font-sans transition-colors cursor-pointer ${
                            selectedGroup === g.name ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                        {g.name}
                    </button>
                ))}
            </div>
            <div className="shrink-0 px-2 pb-2">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="ค้นหา endpoint…"
                        spellCheck={false}
                        className="h-7 w-full rounded-full border border-slate-200 bg-white pl-8 pr-2.5 text-xs font-sans text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                    />
                </div>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-auto px-2 pb-2">
                {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[11px] font-sans text-slate-400">ไม่พบ endpoint</div>
                ) : (
                    filtered.map((g) => (
                        <div key={g.name}>
                            {selectedGroup === null && (
                                <div className="px-1 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-sans">
                                    {g.name}
                                </div>
                            )}
                            {g.endpoints.map((e) => (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => onSelect(e)}
                                    title={e.name}
                                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                        selectedId === e.id ? "border-indigo-200 bg-white shadow-xs" : "border-transparent hover:bg-white/70"
                                    }`}
                                >
                                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold font-sans ${METHOD_STYLE[e.method] || "bg-slate-100 text-slate-600"}`}>
                                        {e.method}
                                    </span>
                                    <span className="truncate text-xs font-sans text-slate-700">{e.path}</span>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
