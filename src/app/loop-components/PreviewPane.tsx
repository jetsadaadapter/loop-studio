"use client";

import React, { useState } from "react";
import { Monitor, Code2, GitCompare, RotateCw, ExternalLink, ArrowRight, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RiskTier } from "@/core/interfaces/loop-projects.interface";

type CheckState = "pass" | "fail" | "idle";

interface PreviewPaneProps {
    // URL of the live app to preview. Defaults to a route that renders directly
    // (no auth redirect) so the pane works out of the box in dev. The app root "/"
    // 307-redirects to /login, so it is a poor default. Point this at "/apps", or a
    // project's own dev server (e.g. http://localhost:3001), once available.
    initialUrl?: string;
    // Latest auto-pipeline outcome (Phase 3) and the task's risk tier, shown next
    // to the tabs — e.g. "Verify ✓  Build ✓  · YELLOW" — so status is visible
    // without leaving the preview.
    verifyStatus?: CheckState;
    buildStatus?: CheckState;
    riskTier?: RiskTier;
}

type PreviewTab = "preview" | "code" | "diff";

const TABS: { key: PreviewTab; label: string; icon: typeof Monitor }[] = [
    { key: "preview", label: "Preview", icon: Monitor },
    { key: "code", label: "Code", icon: Code2 },
    { key: "diff", label: "Diff", icon: GitCompare },
];

const TIER_COLOR: Record<RiskTier, string> = {
    RED: "text-red-400",
    ORANGE: "text-orange-400",
    YELLOW: "text-amber-400",
    GREEN: "text-emerald-400",
};

function CheckBadge({ label, state }: { label: string; state: CheckState }) {
    return (
        <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${
            state === "pass" ? "text-emerald-400" : state === "fail" ? "text-red-400" : "text-slate-500"
        }`}>
            {label}
            {state === "pass" && <Check className="size-3" />}
            {state === "fail" && <X className="size-3" />}
        </span>
    );
}

export function PreviewPane({ initialUrl = "/apps", verifyStatus = "idle", buildStatus = "idle", riskTier }: PreviewPaneProps) {
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
        <div className="flex h-[560px] flex-col overflow-hidden bg-[#0f1930]">
            {/* Tab bar + pipeline status */}
            <div className="flex items-center gap-1.5 border-b border-[#24304b] px-3 py-2">
                {TABS.map(({ key, label, icon: Icon }) => {
                    const active = tab === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
                                active ? "bg-[#1c2c4a] text-white" : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <Icon className="size-3.5" />
                            {label}
                        </button>
                    );
                })}

                <div className="ml-auto flex items-center gap-3">
                    <CheckBadge label="Verify" state={verifyStatus} />
                    <CheckBadge label="Build" state={buildStatus} />
                    {riskTier && (
                        <>
                            <span className="text-slate-600">·</span>
                            <span className={`font-mono text-[11px] ${TIER_COLOR[riskTier]}`}>{riskTier}</span>
                        </>
                    )}
                </div>
            </div>

            {tab === "preview" ? (
                <>
                    {/* URL bar */}
                    <form onSubmit={loadUrl} className="flex items-center gap-2 border-b border-[#24304b] px-3 py-2">
                        <Input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="/ or http://localhost:3001"
                            className="h-7 flex-1 border-[#24304b] bg-[#0b1322] text-xs text-slate-300 placeholder:text-slate-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                            spellCheck={false}
                        />
                        <button
                            type="submit"
                            aria-label="Load URL"
                            title="Load URL"
                            className="flex size-7 items-center justify-center rounded-sm border border-[#24304b] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 cursor-pointer"
                        >
                            <ArrowRight className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setReloadKey((k) => k + 1)}
                            aria-label="Reload preview"
                            title="Reload preview"
                            className="flex size-7 items-center justify-center rounded-sm border border-[#24304b] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 cursor-pointer"
                        >
                            <RotateCw className="size-3.5" />
                        </button>
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open in new tab"
                            title="Open in new tab"
                            className="flex size-7 items-center justify-center rounded-sm border border-[#24304b] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                        >
                            <ExternalLink className="size-3.5" />
                        </a>
                    </form>

                    {/* Live app iframe */}
                    <div className="relative flex-1 min-h-0 bg-[#0f1930] p-4">
                        <div className="size-full overflow-hidden rounded-lg border border-[#24304b] bg-white shadow-2xl">
                            <iframe
                                key={reloadKey}
                                src={url}
                                title="Live app preview"
                                className="size-full border-0 bg-white"
                            />
                        </div>
                    </div>
                    <p className="shrink-0 py-2 text-center font-mono text-[10px] text-slate-500">
                        live · next dev via Live Run
                    </p>
                </>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-[#0f1930] px-6 text-center">
                    {tab === "code" ? <Code2 className="size-6 text-slate-600" /> : <GitCompare className="size-6 text-slate-600" />}
                    <p className="text-sm font-semibold text-slate-300">
                        {tab === "code" ? "Code view" : "Diff view"}
                    </p>
                    <p className="max-w-xs text-xs text-slate-500">
                        Lands in a later phase. For now, the Diff view is available in the Observe stage&apos;s Git workspace.
                    </p>
                </div>
            )}
        </div>
    );
}
