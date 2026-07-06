"use client";

import React, { useState } from "react";
import { ChevronDown, Rocket, Loader2, Check, X, MonitorSmartphone, Tablet } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface StudioWindowProps {
    projectId: string;
    projectName: string;
    left: React.ReactNode;
    right: React.ReactNode;
    onPublished: () => void;
}

// Dark IDE-style chrome for the Studio workspace: a title bar (project name +
// Commit & Publish) wrapping a two-pane body (chat+changes / live preview).
export function StudioWindow({ projectId, projectName, left, right, onPublished }: StudioWindowProps) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

    const publish = async () => {
        if (!message.trim()) return;
        setBusy(true);
        setResult(null);
        try {
            const commitRes = await fetch(`/api/manage/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "commit", commitMessage: message }),
            });
            const commitData = await commitRes.json();
            if (!commitData.success) {
                setResult({ ok: false, text: commitData.error || "Commit failed." });
                return;
            }
            const pushRes = await fetch(`/api/manage/loop-projects/${projectId}/git-action`, {
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
        <div className="flex h-[calc(100vh-180px)] min-h-[640px] flex-col overflow-hidden rounded-2xl border border-[#24304b] bg-[#0b1220] shadow-2xl shadow-black/30">
            {/* Title bar */}
            <div className="flex shrink-0 items-center gap-3 border-b border-[#24304b] bg-[#141e33] px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-sans">
                    {projectName}
                    <ChevronDown className="size-3.5 text-slate-500" />
                </span>
                <div className="ml-2 flex items-center gap-1">
                    <span className="flex size-6 items-center justify-center rounded-md border border-[#35507f] bg-[#1c2c4a] text-slate-100">
                        <MonitorSmartphone className="size-3.5" />
                    </span>
                    <span className="flex size-6 items-center justify-center rounded-md border border-[#24304b] text-slate-500">
                        <Tablet className="size-3.5" />
                    </span>
                </div>

                <div className="relative ml-auto">
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        className="flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 cursor-pointer"
                    >
                        <Rocket className="size-3.5" />
                        Commit &amp; Publish
                    </button>

                    {open && (
                        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-[#24304b] bg-[#141e33] p-3 shadow-2xl">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-sans">
                                Commit workspace changes
                            </p>
                            <Textarea
                                rows={2}
                                autoFocus
                                placeholder="feat: add rounding option to Button"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={busy}
                                className="min-h-0 resize-none rounded-lg border-[#24304b] bg-[#0d1526] px-2.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                            />
                            {result && (
                                <p className={`mt-2 flex items-center gap-1.5 text-[10px] font-sans ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
                                    {result.ok ? <Check className="size-3" /> : <X className="size-3" />}
                                    {result.text}
                                </p>
                            )}
                            <div className="mt-2.5 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={publish}
                                    disabled={busy || !message.trim()}
                                    className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 cursor-pointer"
                                >
                                    {busy ? <Loader2 className="size-3 animate-spin" /> : <Rocket className="size-3" />}
                                    {busy ? "Publishing…" : "Publish"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Body: chat+changes rail (full height, own scroll) / scrollable main
                column (preview, then everything below it). */}
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                <div className="flex h-[70vh] min-h-0 shrink-0 flex-col border-[#24304b] lg:h-full lg:w-[380px] lg:border-r">
                    {left}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">{right}</div>
            </div>
        </div>
    );
}
