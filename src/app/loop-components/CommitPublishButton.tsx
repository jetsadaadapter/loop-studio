"use client";

import React, { useState } from "react";
import { Rocket, Loader2, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface CommitPublishButtonProps {
    projectId: string;
    taskName?: string;
    onPublished: () => void;
}

// Commit + push flow, extracted from StudioWindow so it can sit inline in
// PreviewPane's tab bar instead of its own dedicated title-bar row.
export function CommitPublishButton({ projectId, taskName, onPublished }: CommitPublishButtonProps) {
    const [open, setOpen] = useState(false);
    const defaultMessage = taskName ? `feat: ${taskName}` : "";
    const [message, setMessage] = useState(defaultMessage);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

    const openPopup = () => {
        setResult(null);
        setMessage(defaultMessage); // reset to auto-fill every time popup opens
        setOpen((o) => !o);
    };

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
            setMessage(defaultMessage); // reset to default (not empty) for next publish
            onPublished();
        } catch {
            setResult({ ok: false, text: "Publish failed due to a network error." });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={openPopup}
                className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 cursor-pointer"
            >
                <Rocket className="size-3.5" />
                Commit &amp; Publish
            </button>

            {open && (
                <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 font-sans">
                        Commit &amp; Push
                    </p>
                    {taskName && (
                        <p className="mb-2 text-[10px] text-slate-400 font-sans truncate">
                            Task: {taskName}
                        </p>
                    )}
                    <Textarea
                        rows={3}
                        autoFocus
                        placeholder="feat: describe your changes"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onFocus={(e) => e.currentTarget.select()}
                        disabled={busy}
                        className="min-h-0 resize-none rounded-lg border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-850 placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                    />
                    <p className="mt-1 text-[10px] text-slate-400 font-sans">Edit or overtype — then press Publish.</p>
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
    );
}
