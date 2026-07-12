"use client";

import React, { useState, useEffect } from "react";
import { Monitor, Code2, GitCompare, RotateCw, ExternalLink, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RiskTier } from "@/core/interfaces/loop-projects.interface";

type CheckState = "pass" | "fail" | "idle";

interface PreviewPaneProps {
    // URL of the live app to preview. Point this at the project's own dev server
    // (project.previewUrl, e.g. http://localhost:3001). Falls back to this app's
    // root, which renders without auth, when the project has no preview URL set.
    initialUrl?: string;
    // Latest auto-pipeline outcome (Phase 3) and the task's risk tier, shown next
    // to the tabs — e.g. "Verify ✓  Build ✓  · YELLOW" — so status is visible
    // without leaving the preview.
    verifyStatus?: CheckState;
    buildStatus?: CheckState;
    riskTier?: RiskTier;
    projectId: string;
    taskId: string;
    targetFiles?: string[];
    deviceMode?: "desktop" | "mobile";
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
        <span className={`inline-flex items-center gap-1 font-sans text-xs ${
            state === "pass" ? "text-emerald-400" : state === "fail" ? "text-red-400" : "text-slate-500"
        }`}>
            {label}
            {state === "pass" && <Check className="size-3" />}
            {state === "fail" && <X className="size-3" />}
        </span>
    );
}

export function PreviewPane({
    initialUrl = "/",
    verifyStatus = "idle",
    buildStatus = "idle",
    riskTier,
    projectId,
    taskId,
    targetFiles = [],
    deviceMode = "desktop"
}: PreviewPaneProps) {
    const [url, setUrl] = useState(initialUrl);
    const [inputUrl, setInputUrl] = useState(initialUrl);
    const [tab, setTab] = useState<PreviewTab>("preview");
    const [reloadKey, setReloadKey] = useState(0);

    // Code viewing states
    const [selectedFile, setSelectedFile] = useState(targetFiles[0] || "");
    const [codeContent, setCodeContent] = useState("");
    const [loadingCode, setLoadingCode] = useState(false);
    const [codeError, setCodeError] = useState("");

    // Diff viewing states
    const [diffContent, setDiffContent] = useState("");
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [diffError, setDiffError] = useState("");

    // Update selected file if targetFiles changes
    useEffect(() => {
        if (targetFiles.length > 0 && !targetFiles.includes(selectedFile)) {
            setSelectedFile(targetFiles[0]);
        }
    }, [targetFiles, selectedFile]);

    // Fetch code content
    useEffect(() => {
        if (tab !== "code" || !selectedFile) return;

        setLoadingCode(true);
        setCodeError("");
        fetch(`/api/loop-projects/${projectId}/files?file=${encodeURIComponent(selectedFile)}`)
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setCodeContent(json.data);
                } else {
                    setCodeError(json.error || "Failed to load file content.");
                }
            })
            .catch(() => {
                setCodeError("Network error: failed to load file content.");
            })
            .finally(() => {
                setLoadingCode(false);
            });
    }, [tab, selectedFile, projectId]);

    // Fetch git diff
    useEffect(() => {
        if (tab !== "diff") return;

        setLoadingDiff(true);
        setDiffError("");
        fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/diff`)
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setDiffContent(json.data);
                } else {
                    setDiffError(json.error || "Failed to load git diff.");
                }
            })
            .catch(() => {
                setDiffError("Network error: failed to load git diff.");
            })
            .finally(() => {
                setLoadingDiff(false);
            });
    }, [tab, taskId, projectId]);

    const loadUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const next = inputUrl.trim();
        if (!next) return;
        setUrl(next);
        setReloadKey((k) => k + 1);
    };

    // Helper to format code with non-selectable line numbers
    const formatCode = (codeText: string) => {
        if (!codeText) return null;
        return codeText.split("\n").map((line, idx) => (
            <div key={idx} className="flex hover:bg-slate-900 px-1 rounded-xs transition-colors py-0.5">
                <span className="w-10 select-none text-slate-600 text-right pr-3 font-sans font-semibold text-[10px]">{idx + 1}</span>
                <span className="flex-1 whitespace-pre">{line}</span>
            </div>
        ));
    };

    // Helper to format and colorize git diff output
    const formatDiff = (diffText: string) => {
        if (!diffText) return null;
        return diffText.split("\n").map((line, idx) => {
            let className = "text-slate-400";
            if (line.startsWith("+") && !line.startsWith("+++")) {
                className = "text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded-xs block";
            } else if (line.startsWith("-") && !line.startsWith("---")) {
                className = "text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded-xs block";
            } else if (line.startsWith("@@")) {
                className = "text-cyan-400 font-semibold py-0.5 block";
            } else if (line.startsWith("diff") || line.startsWith("index")) {
                className = "text-slate-500 font-semibold block";
            }
            return (
                <div key={idx} className={`${className} whitespace-pre`}>
                    {line}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 h-full">
            {/* Tab bar + pipeline status */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 shrink-0">
                {TABS.map(({ key, label, icon: Icon }) => {
                    const active = tab === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-sans text-xs transition-colors cursor-pointer ${
                                active
                                    ? "bg-slate-100 text-slate-800 border border-slate-200/50 shadow-3xs"
                                    : "text-slate-500 hover:text-slate-850 hover:bg-slate-50 border border-transparent"
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
                            <span className="text-slate-400">·</span>
                            <span className={`font-sans text-xs ${TIER_COLOR[riskTier]}`}>{riskTier}</span>
                        </>
                    )}
                </div>
            </div>

            {tab === "preview" ? (
                <>
                    {/* URL bar */}
                    <form onSubmit={loadUrl} className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 shrink-0">
                        <Input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="/ or http://localhost:3001"
                            className="h-7 flex-1 border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                            spellCheck={false}
                        />
                        <button
                            type="submit"
                            aria-label="Load URL"
                            title="Load URL"
                            className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-500 bg-white transition-colors hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                        >
                            <ArrowRight className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setReloadKey((k) => k + 1)}
                            aria-label="Reload preview"
                            title="Reload preview"
                            className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-500 bg-white transition-colors hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                        >
                            <RotateCw className="size-3.5" />
                        </button>
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open in new tab"
                            title="Open in new tab"
                            className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-500 bg-white transition-colors hover:bg-slate-50 hover:text-slate-800"
                        >
                            <ExternalLink className="size-3.5" />
                        </a>
                    </form>

                    {/* Live app iframe */}
                    <div className="relative flex-1 min-h-0 bg-slate-100/60 p-4 flex items-center justify-center">
                        <div className={`overflow-hidden bg-white shadow-2xl transition-all duration-300 ease-in-out ${
                            deviceMode === "mobile"
                                ? "w-[375px] h-[95%] border-[12px] border-slate-800 rounded-[32px] relative shadow-inner"
                                : "size-full rounded-lg border border-slate-200"
                        }`}>
                            <iframe
                                key={reloadKey}
                                src={url}
                                title="Live app preview"
                                className="size-full border-0 bg-white"
                            />
                        </div>
                    </div>
                    <p className="shrink-0 py-2 text-center font-sans text-xs text-slate-400 select-none bg-white border-t border-slate-100">
                        live · next dev via Live Run
                    </p>
                </>
            ) : tab === "code" ? (
                <>
                    {/* File selection tab header if there are multiple targetFiles */}
                    {targetFiles.length > 1 && (
                        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1 bg-slate-50 shrink-0 overflow-x-auto select-none">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Files:</span>
                            {targetFiles.map((file) => {
                                const active = file === selectedFile;
                                const filename = file.split("/").pop() || file;
                                return (
                                    <button
                                        key={file}
                                        onClick={() => setSelectedFile(file)}
                                        className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer border ${
                                            active
                                                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                        }`}
                                    >
                                        {filename}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 select-text">
                        {loadingCode ? (
                            <div className="flex h-full items-center justify-center gap-2 text-slate-500 animate-pulse font-sans">
                                <Loader2 className="size-4 animate-spin text-indigo-500" /> Loading file content...
                            </div>
                        ) : codeError ? (
                            <div className="text-red-400 p-2 font-sans">{codeError}</div>
                        ) : (
                            <div className="space-y-0.5">
                                {formatCode(codeContent)}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 select-text">
                    {loadingDiff ? (
                        <div className="flex h-full items-center justify-center gap-2 text-slate-500 animate-pulse font-sans">
                            <Loader2 className="size-4 animate-spin text-indigo-500" /> Loading git diff...
                        </div>
                    ) : diffError ? (
                        <div className="text-red-400 p-2 font-sans">{diffError}</div>
                    ) : !diffContent || diffContent.trim() === "" ? (
                        <div className="flex h-full items-center justify-center text-slate-500 font-sans">
                            No changes detected (working directory clean)
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {formatDiff(diffContent)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
