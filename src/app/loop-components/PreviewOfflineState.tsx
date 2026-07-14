"use client";

import React, { useState } from "react";
import { ServerOff, PlayCircle, RotateCw, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { LogTerminal } from "./LogTerminal";

interface PreviewOfflineStateProps {
    url: string;
    projectId: string;
    onRetry: () => Promise<void>;
}

// Replaces the browser's own "refused to connect" page inside the iframe —
// that page renders as content the parent can't detect or restyle, so a dead
// dev-server port used to look like a broken app instead of an expected
// "nothing is running here yet" state. Shown whenever PreviewPane's server-side
// reachability probe reports the target port isn't accepting connections.
export function PreviewOfflineState({ url, projectId, onRetry }: PreviewOfflineStateProps) {
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState("");
    const [showLogs, setShowLogs] = useState(false);
    const [runKey, setRunKey] = useState(0);
    const [retrying, setRetrying] = useState(false);

    const handleStart = async () => {
        setStarting(true);
        setStartError("");
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "dev" }),
            });
            const data = await res.json();
            if (data.success) {
                // Only now did the server truly (re)start the process and reset its
                // log file — showing the terminal before this point risks flashing
                // stale output left over from a previous, unrelated run.
                setShowLogs(true);
                setRunKey((k) => k + 1);
            } else {
                setStartError(data.error || "Failed to start the dev server.");
            }
        } catch {
            setStartError("Network error while starting the dev server.");
        } finally {
            // The dev server can take a while to bind its port — this only
            // re-enables the button so the user isn't stuck if it crashes
            // early; PreviewPane's own polling is what actually detects
            // success and swaps this state out for the live iframe.
            setTimeout(() => setStarting(false), 6000);
        }
    };

    const handleRetry = async () => {
        setRetrying(true);
        try {
            await onRetry();
        } finally {
            setRetrying(false);
        }
    };

    return (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-5 bg-slate-50 px-6 py-8 overflow-y-auto">
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                    <ServerOff className="size-5.5 text-slate-400" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-800 font-sans">Dev server isn&apos;t running</h3>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                        Nothing is listening at{" "}
                        <span className="font-semibold text-slate-700 break-all">{url}</span> yet. Start the
                        project&apos;s dev server and this preview reconnects automatically.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting}
                    className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                    {starting ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
                    {starting ? "Starting…" : "Start Dev Server"}
                </button>
                <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                    <RotateCw className={`size-3.5 ${retrying ? "animate-spin" : ""}`} />
                    Retry
                </button>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                    <ExternalLink className="size-3.5" />
                    Open in new tab
                </a>
            </div>

            {startError && (
                <p className="flex items-center gap-1.5 text-xs text-red-650 font-sans">
                    <AlertTriangle className="size-3.5" />
                    {startError}
                </p>
            )}

            {showLogs && (
                <div className="w-full max-w-2xl h-48 shrink-0">
                    <LogTerminal projectId={projectId} taskId={`run-${projectId}`} triggerCount={runKey} />
                </div>
            )}
        </div>
    );
}
