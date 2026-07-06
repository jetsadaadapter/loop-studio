"use client";

import React, { useState } from "react";
import { Monitor, Code2, GitCompare, RotateCw, ExternalLink, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PreviewPaneProps {
    // URL of the live app to preview. Defaults to a route that renders directly
    // (no auth redirect) so the pane works out of the box in dev. The app root "/"
    // 307-redirects to /login, so it is a poor default. Point this at "/apps", or a
    // project's own dev server (e.g. http://localhost:3001), once available.
    initialUrl?: string;
}

type PreviewTab = "preview" | "code" | "diff";

const TABS: { key: PreviewTab; label: string; icon: typeof Monitor }[] = [
    { key: "preview", label: "Preview", icon: Monitor },
    { key: "code", label: "Code", icon: Code2 },
    { key: "diff", label: "Diff", icon: GitCompare },
];

export function PreviewPane({ initialUrl = "/apps" }: PreviewPaneProps) {
    const [url, setUrl] = useState(initialUrl);
    const [inputUrl, setInputUrl] = useState(initialUrl);
    const [tab, setTab] = useState<PreviewTab>("preview");
    const [reloadKey, setReloadKey] = useState(0);

    const loadUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const next = inputUrl.trim();
        if (!next) return;
        setUrl(next);
        setReloadKey((k) => k + 1);
    };

    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-3xs">
            {/* Tab bar */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                {TABS.map(({ key, label, icon: Icon }) => {
                    const active = tab === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                                active
                                    ? "bg-white text-slate-800 shadow-3xs border border-slate-200/60"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <Icon className="size-3.5" />
                            {label}
                        </button>
                    );
                })}
            </div>

            {tab === "preview" ? (
                <>
                    {/* URL bar */}
                    <form onSubmit={loadUrl} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                        <Input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="/ or http://localhost:3001"
                            className="h-8 flex-1 text-xs"
                            spellCheck={false}
                        />
                        <button
                            type="submit"
                            aria-label="Load URL"
                            title="Load URL"
                            className="flex size-8 items-center justify-center rounded-sm border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                        >
                            <ArrowRight className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setReloadKey((k) => k + 1)}
                            aria-label="Reload preview"
                            title="Reload preview"
                            className="flex size-8 items-center justify-center rounded-sm border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                        >
                            <RotateCw className="size-3.5" />
                        </button>
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open in new tab"
                            title="Open in new tab"
                            className="flex size-8 items-center justify-center rounded-sm border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                        >
                            <ExternalLink className="size-3.5" />
                        </a>
                    </form>

                    {/* Live app iframe */}
                    <div className="relative h-[420px] bg-slate-100">
                        <iframe
                            key={reloadKey}
                            src={url}
                            title="Live app preview"
                            className="size-full border-0 bg-white"
                        />
                    </div>
                </>
            ) : (
                <div className="flex h-[420px] flex-col items-center justify-center gap-2 bg-slate-50/40 px-6 text-center">
                    {tab === "code" ? <Code2 className="size-6 text-slate-300" /> : <GitCompare className="size-6 text-slate-300" />}
                    <p className="text-sm font-semibold text-slate-600">
                        {tab === "code" ? "Code view" : "Diff view"}
                    </p>
                    <p className="max-w-xs text-xs text-slate-400">
                        Lands in a later phase. For now, the Diff view is available in the Observe stage&apos;s Git workspace.
                    </p>
                </div>
            )}
        </div>
    );
}
