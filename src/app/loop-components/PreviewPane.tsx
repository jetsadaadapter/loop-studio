"use client";

import React, { useState, useEffect } from "react";
import { Monitor, Code2, GitCompare, RotateCw, ExternalLink, ArrowRight, Check, Loader2, AlertTriangle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RiskTier } from "@/core/interfaces/loop-projects.interface";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

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

const ALL_TABS: { key: PreviewTab; label: string; icon: typeof Monitor }[] = [
    { key: "preview", label: "Preview", icon: Monitor },
    { key: "code", label: "Code", icon: Code2 },
    { key: "diff", label: "Diff", icon: GitCompare },
];

const TIER_VARIANTS: Record<RiskTier, BadgeVariant> = {
    RED: "error",
    ORANGE: "orange",
    YELLOW: "warning",
    GREEN: "success",
};

const STATUS_INFO: Record<string, { title: string; pass: string; fail: string }> = {
    Verify: {
        title: "Linting & Type Check",
        pass: "ESLint and TypeScript checks passed. Code is clean.",
        fail: "ESLint or TypeScript found errors. Run \"npm run lint\" or \"npx tsc\" in the project to see details, then fix the errors and re-run the task.",
    },
    Build: {
        title: "Production Build",
        pass: "Build succeeded — app is deployable.",
        fail: "Build failed. Run \"npm run build\" to see the error log. Common causes: missing imports, type errors, or env variable issues. Fix and re-trigger the pipeline.",
    },
};

function StatusBadge({ label, state }: { label: string; state: CheckState }) {
    const [show, setShow] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const info = STATUS_INFO[label];
    if (state === "idle") return null;

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        setRect(e.currentTarget.getBoundingClientRect());
        setShow(true);
    };

    return (
        <span>
            <button
                type="button"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setShow(false)}
                onFocus={(e) => { setRect(e.currentTarget.getBoundingClientRect()); setShow(true); }}
                onBlur={() => setShow(false)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold font-sans uppercase border transition-colors cursor-help select-none ${
                    state === "pass"
                        ? "text-[#499A13] bg-[#499A13]/5 border-[#499A13]/20 hover:bg-[#499A13]/10"
                        : "text-red-700 bg-red-50 border-red-200/60 hover:bg-red-100/60"
                }`}
            >
                {state === "pass" ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
                {label}
            </button>
            {show && info && rect && (
                <div
                    style={{
                        position: "fixed",
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right,
                        zIndex: 9999,
                    }}
                    className="w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl text-left pointer-events-none"
                >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                        <Info className="size-3" /> {info.title}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                        {state === "pass" ? info.pass : info.fail}
                    </p>
                </div>
            )}
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

    // Derive the file to display: keep user's selection if still valid, else fall back to first file.
    const effectiveSelectedFile = targetFiles.includes(selectedFile)
        ? selectedFile
        : (targetFiles[0] ?? "");

    // Determine which tabs have data to show
    const hasCodeFiles = targetFiles.length > 0;
    const hasDiffData = verifyStatus !== "idle" || buildStatus !== "idle";

    const visibleTabs = ALL_TABS.filter((t) => {
        if (t.key === "code") return hasCodeFiles;
        if (t.key === "diff") return hasDiffData;
        return true;
    });

    // If the current tab becomes hidden (e.g. files cleared), fall back to preview
    useEffect(() => {
        const checkFallback = () => {
            if (!visibleTabs.some((t) => t.key === tab)) {
                setTab("preview");
            }
        };
        checkFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasCodeFiles, hasDiffData]);

    // Fetch code content
    useEffect(() => {
        if (tab !== "code" || !effectiveSelectedFile) return;

        const beginFetch = () => {
            setLoadingCode(true);
            setCodeError("");
            fetch(`/api/loop-projects/${projectId}/files?file=${encodeURIComponent(effectiveSelectedFile)}`)
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
        };
        beginFetch();
    }, [tab, effectiveSelectedFile, projectId]);

    // Fetch git diff
    useEffect(() => {
        if (tab !== "diff") return;

        const beginFetch = () => {
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
        };
        beginFetch();
    }, [tab, taskId, projectId]);

    const loadUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const next = inputUrl.trim();
        if (!next) return;
        setUrl(next);
        setReloadKey((k) => k + 1);
    };

    // Token-based syntax highlighter for TS/TSX/JS/CSS files
    const highlightLine = (lineText: string, fileExt: string): React.ReactNode => {
        if (!lineText) return <br />;

        // For CSS files
        if (fileExt === "css") {
            // Selector / property / value
            const cssLine = lineText
                .replace(/([a-z-]+)\s*:/g, '<span class="css-prop">$1</span>:')
                .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[0-9.]+(?:px|em|rem|%|vh|vw|s))/g, '<span class="css-val">$1</span>');
            return <span dangerouslySetInnerHTML={{ __html: cssLine }} />;
        }

        // Token types and their Tailwind text colours
        type Token = { text: string; color: string };
        const tokens: Token[] = [];

        const TS_KEYWORDS = /^(import|export|from|default|const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|extends|implements|interface|type|enum|async|await|try|catch|finally|throw|new|typeof|instanceof|void|null|undefined|true|false|in|of|as|declare|abstract|static|readonly|public|private|protected|override|super|this|keyof|infer|never|any|unknown|string|number|boolean|object|symbol|bigint|React|useState|useEffect|useRef|useCallback|useMemo|useContext)\b/;

        let remaining = lineText;
        while (remaining.length > 0) {
            // Single-line comment
            if (remaining.startsWith("//")) {
                tokens.push({ text: remaining, color: "#6b7280" }); // slate-500
                break;
            }
            // Template literal
            if (remaining.startsWith("`")) {
                const end = remaining.indexOf("`", 1);
                const chunk = end === -1 ? remaining : remaining.slice(0, end + 1);
                tokens.push({ text: chunk, color: "#fb923c" }); // orange-400
                remaining = end === -1 ? "" : remaining.slice(end + 1);
                continue;
            }
            // Double-quoted string
            if (remaining.startsWith('"')) {
                const match = remaining.match(/^"(?:[^"\\]|\\.)*"/);
                const chunk = match ? match[0] : remaining;
                tokens.push({ text: chunk, color: "#4ade80" }); // green-400
                remaining = remaining.slice(chunk.length);
                continue;
            }
            // Single-quoted string
            if (remaining.startsWith("'")) {
                const match = remaining.match(/^'(?:[^'\\]|\\.)*'/);
                const chunk = match ? match[0] : remaining;
                tokens.push({ text: chunk, color: "#4ade80" }); // green-400
                remaining = remaining.slice(chunk.length);
                continue;
            }
            // JSX tag name (e.g. <Component or </Component)
            const jsxTagMatch = remaining.match(/^(<\/?[A-Z][A-Za-z0-9]*)/);
            if (jsxTagMatch) {
                tokens.push({ text: jsxTagMatch[0], color: "#60a5fa" }); // blue-400
                remaining = remaining.slice(jsxTagMatch[0].length);
                continue;
            }
            // lowercase html tag
            const htmlTagMatch = remaining.match(/^(<\/?[a-z][a-z0-9-]*)/);
            if (htmlTagMatch) {
                tokens.push({ text: htmlTagMatch[0], color: "#94a3b8" }); // slate-400
                remaining = remaining.slice(htmlTagMatch[0].length);
                continue;
            }
            // Numbers
            const numMatch = remaining.match(/^\b\d+(\.\d+)?\b/);
            if (numMatch) {
                tokens.push({ text: numMatch[0], color: "#f472b6" }); // pink-400
                remaining = remaining.slice(numMatch[0].length);
                continue;
            }
            // Keywords
            const kwMatch = remaining.match(TS_KEYWORDS);
            if (kwMatch) {
                tokens.push({ text: kwMatch[0], color: "#c084fc" }); // purple-400
                remaining = remaining.slice(kwMatch[0].length);
                continue;
            }
            // JSX attribute
            const attrMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)(?==)/);
            if (attrMatch) {
                tokens.push({ text: attrMatch[0], color: "#7dd3fc" }); // sky-300
                remaining = remaining.slice(attrMatch[0].length);
                continue;
            }
            // Identifiers / punctuation
            const identMatch = remaining.match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
            if (identMatch) {
                tokens.push({ text: identMatch[0], color: "#e2e8f0" }); // slate-200
                remaining = remaining.slice(identMatch[0].length);
                continue;
            }
            // Operators / brackets
            const opMatch = remaining.match(/^[=><!&|+\-*/%?:;,.()\[\]{}<]/);
            if (opMatch) {
                tokens.push({ text: opMatch[0], color: "#94a3b8" }); // slate-400
                remaining = remaining.slice(1);
                continue;
            }
            // Fallback: single char
            tokens.push({ text: remaining[0], color: "#e2e8f0" });
            remaining = remaining.slice(1);
        }

        return (
            <>
                {tokens.map((tok, i) => (
                    <span key={i} style={{ color: tok.color }}>{tok.text}</span>
                ))}
            </>
        );
    };

    // Helper to format code with non-selectable line numbers + syntax highlighting
    const formatCode = (codeText: string) => {
        if (!codeText) return null;
        const ext = effectiveSelectedFile.split(".").pop()?.toLowerCase() ?? "ts";
        return codeText.split("\n").map((line, idx) => (
            <div key={idx} className="flex hover:bg-white/5 px-1 rounded-xs transition-colors py-[1px] group">
                <span className="w-10 select-none text-slate-600 text-right pr-3 font-sans font-normal text-[10px] leading-5 group-hover:text-slate-500">{idx + 1}</span>
                <span className="flex-1 whitespace-pre font-sans text-[11px] leading-5">{highlightLine(line, ext)}</span>
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
                {visibleTabs.map(({ key, label, icon: Icon }) => {
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

                <div className="ml-auto flex items-center gap-1.5">
                    <StatusBadge label="Verify" state={verifyStatus} />
                    <StatusBadge label="Build" state={buildStatus} />
                    {riskTier && (
                        <>
                            <span className="text-slate-300">·</span>
                            <Badge variant={TIER_VARIANTS[riskTier]}>
                                {riskTier}
                            </Badge>
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

                    {/* Live app iframe — full bleed, no padding */}
                    {deviceMode === "mobile" ? (
                        <div className="relative flex-1 min-h-0 bg-slate-200 flex items-center justify-center overflow-hidden">
                            <div className="w-[375px] h-[95%] border-[12px] border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
                                <iframe
                                    key={reloadKey}
                                    src={url}
                                    title="Live app preview"
                                    className="size-full border-0 bg-white"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex-1 min-h-0 overflow-hidden">
                            <iframe
                                key={reloadKey}
                                src={url}
                                title="Live app preview"
                                className="size-full border-0 bg-white"
                            />
                        </div>
                    )}
                </>
            ) : tab === "code" ? (
                <>
                    {/* File selection tab header if there are multiple targetFiles */}
                    {targetFiles.length > 1 && (
                        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1 bg-slate-50 shrink-0 overflow-x-auto select-none">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Files:</span>
                            {targetFiles.map((file) => {
                                const active = file === effectiveSelectedFile;
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

                    <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950 font-sans text-xs text-slate-300 select-text">
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
                <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950 font-sans text-xs text-slate-300 select-text">
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
