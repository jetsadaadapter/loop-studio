"use client";

import React, { useState } from "react";
import { ChevronDown, Rocket, Loader2, Check, X, MonitorSmartphone, Tablet, Maximize2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface StudioWindowProps {
    projectId: string;
    projectName: string;
    left: React.ReactNode;
    right: React.ReactNode;
    onPublished: () => void;
    deviceMode?: "desktop" | "mobile";
    onDeviceModeChange?: (mode: "desktop" | "mobile") => void;
    header?: React.ReactNode;
}

// IDE-style chrome for the Studio workspace: a title bar (project name +
// Commit & Publish) wrapping a two-pane body (chat+changes / live preview).
export function StudioWindow({
    projectId,
    projectName,
    left,
    right,
    onPublished,
    deviceMode = "desktop",
    onDeviceModeChange,
    header
}: StudioWindowProps) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
    const [isChatExpanded, setIsChatExpanded] = useState(true);
    const [isChatMaximized, setIsChatMaximized] = useState(false);

    const publish = async () => {
        if (!message.trim()) return;
        setBusy(true);
        setResult(null);
        try {
            const commitRes = await fetch(`/api/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "commit", commitMessage: message }),
            });
            const commitData = await commitRes.json();
            if (!commitData.success) {
                setResult({ ok: false, text: commitData.error || "Commit failed." });
                return;
            }
            const pushRes = await fetch(`/api/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "push" }),
            });
            const pushData = await pushRes.json();
            if (!pushData.success) {
                setResult({ ok: false, text: `Committed, but push failed: ${pushData.error}` });
                return;
            }
            setResult({ ok: true, text: "Committed and pushed." });
            setMessage("");
            onPublished();
        } catch {
            setResult({ ok: false, text: "Publish failed due to a network error." });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-slate-100/60 relative">
            {/* Workspace Column (Left / Center) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {header}
                {/* Title bar */}
                <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
                    <span className="text-xs font-bold text-slate-800 font-sans select-none">
                        {projectName}
                    </span>
                    <div className="ml-2 flex items-center gap-1.5 select-none">
                        <button
                            type="button"
                            onClick={() => onDeviceModeChange?.("desktop")}
                            title="Desktop View"
                            className={`flex size-7 cursor-pointer items-center justify-center rounded-md border transition-all ${
                                deviceMode === "desktop"
                                    ? "border-indigo-250 bg-indigo-50 text-indigo-600 shadow-3xs"
                                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                        >
                            <MonitorSmartphone className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeviceModeChange?.("mobile")}
                            title="Mobile View"
                            className={`flex size-7 cursor-pointer items-center justify-center rounded-md border transition-all ${
                                deviceMode === "mobile"
                                    ? "border-indigo-250 bg-indigo-50 text-indigo-600 shadow-3xs"
                                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                        >
                            <Tablet className="size-3.5" />
                        </button>
                    </div>

                    <div className="relative ml-auto">
                        <button
                            type="button"
                            onClick={() => setOpen((o) => !o)}
                            className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 cursor-pointer"
                        >
                            <Rocket className="size-3.5" />
                            Commit &amp; Publish
                        </button>

                        {open && (
                            <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700 font-sans">
                                    Commit workspace changes
                                </p>
                                <Textarea
                                    rows={2}
                                    autoFocus
                                    placeholder="feat: add rounding option to Button"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={busy}
                                    className="min-h-0 resize-none rounded-lg border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-850 placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                                />
                                {result && (
                                    <p className={`mt-2 flex items-center gap-1.5 text-xs font-sans ${result.ok ? "text-emerald-600" : "text-red-650"}`}>
                                        {result.ok ? <Check className="size-3" /> : <X className="size-3" />}
                                        {result.text}
                                    </p>
                                )}
                                <div className="mt-2.5 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-650 cursor-pointer"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        onClick={publish}
                                        disabled={busy || !message.trim()}
                                        className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 cursor-pointer"
                                    >
                                        {busy ? <Loader2 className="size-3 animate-spin" /> : <Rocket className="size-3" />}
                                        {busy ? "Publishing…" : "Publish"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Viewport Content (Preview & bottom controls) */}
                <div className="min-h-0 flex-1 flex flex-col bg-slate-50 overflow-hidden">{right}</div>
            </div>

            {/* Collapsible Chat Panel on the right (stretches full height) */}
            {isChatExpanded ? (
                <div className={`flex min-h-0 shrink-0 flex-col bg-white transition-all duration-300 ease-in-out ${
                    isChatMaximized 
                        ? "absolute right-3 top-3 bottom-3 z-30 w-[600px] max-w-[90vw] shadow-2xl border border-slate-200 rounded-xl overflow-hidden" 
                        : "relative w-[380px] h-full border-l border-slate-200"
                }`}>
                    <div className="flex-1 flex flex-col min-h-0">
                        {React.isValidElement(left)
                            ? React.cloneElement(left as React.ReactElement<{ 
                                  onCollapse: () => void;
                                  onExpand: () => void;
                                  isMaximized: boolean;
                              }>, {
                                  onCollapse: () => {
                                      setIsChatExpanded(false);
                                      setIsChatMaximized(false);
                                  },
                                  onExpand: () => setIsChatMaximized((prev) => !prev),
                                  isMaximized: isChatMaximized
                              })
                            : left}
                    </div>
                </div>
            ) : (
                <div className="flex h-full min-h-0 shrink-0 flex-col bg-white w-12 items-center py-3 select-none transition-all duration-300 ease-in-out border-l border-slate-200">
                    <button
                        type="button"
                        onClick={() => setIsChatExpanded(true)}
                        title="Expand Chat"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm"
                    >
                        <Maximize2 className="size-3.5" />
                    </button>
                    
                    {/* Vertical text label + chat icon */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsChatExpanded(true)}
                            title="Expand Chat"
                            className="relative flex size-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-all shadow-sm"
                        >
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-450 opacity-75"></span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                        <div 
                            onClick={() => setIsChatExpanded(true)}
                            className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans cursor-pointer hover:text-slate-800 transition-colors" 
                            style={{ writingMode: "vertical-lr" }}
                        >
                            AI Chat Space
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
