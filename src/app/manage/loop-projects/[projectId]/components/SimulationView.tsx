"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Hammer,
    ShieldCheck,
    FlaskConical,
    MonitorPlay,
    Rocket,
    Terminal,
    Copy,
    Check,
    Loader2,
    AlertTriangle,
    type LucideIcon,
} from "lucide-react";

interface SimulationViewProps {
    projectId: string;
}

type RunType = "build" | "lint" | "test" | "e2e" | "dev";

const RUN_ACTIONS: { type: RunType; label: string; icon: LucideIcon; primary?: boolean }[] = [
    { type: "build", label: "Build", icon: Hammer, primary: true },
    { type: "lint", label: "Lint", icon: ShieldCheck },
    { type: "test", label: "Unit Tests", icon: FlaskConical },
    { type: "e2e", label: "E2E (Playwright)", icon: MonitorPlay },
    { type: "dev", label: "Start Dev", icon: Rocket },
];

export function SimulationView({ projectId }: SimulationViewProps) {
    const [logs, setLogs] = useState("No execution logs yet.\n");
    const [copied, setCopied] = useState(false);
    const [running, setRunning] = useState<RunType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [triggerCount, setTriggerCount] = useState(0);
    const logRef = useRef<HTMLPreElement>(null);

    const taskId = `run-${projectId}`;

    // Live log stream — mirrors LogTerminal streaming pattern.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLogs("Connecting log stream...\n");
        const eventSource = new EventSource(`/api/manage/loop-projects/${projectId}/tasks/${taskId}/logs`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.text) {
                    setLogs((prev) => {
                        if (prev === "Connecting log stream...\n" || prev === "No execution logs yet.\n") {
                            return data.text;
                        }
                        return prev + data.text;
                    });
                }
            } catch {
                // ignore
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [projectId, taskId, triggerCount]);

    // Scroll to bottom on logs update
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    const handleRun = async (type: RunType) => {
        setRunning(type);
        setError(null);
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to start command");
            }
            // Re-subscribe to the log stream so the fresh run is picked up.
            setTriggerCount((c) => c + 1);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setRunning(null);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(logs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4 font-sans">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-3xs">
                <div className="flex items-center gap-1.5 mb-1">
                    <MonitorPlay className="size-4 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-slate-800">Live Run</h2>
                </div>
                <p className="text-[11px] text-amber-600 flex items-center gap-1 mb-3">
                    <AlertTriangle className="size-3" />
                    Executes real commands in the project directory and streams live output.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    {RUN_ACTIONS.map(({ type, label, icon: Icon, primary }) => {
                        const isRunning = running === type;
                        const base = "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
                        const style = primary
                            ? "bg-brand hover:bg-brand/90 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
                        return (
                            <button
                                key={type}
                                onClick={() => handleRun(type)}
                                disabled={running !== null}
                                className={`${base} ${style}`}
                            >
                                {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
                                {label}
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <p className="mt-2 text-[11px] text-red-600 flex items-center gap-1">
                        <AlertTriangle className="size-3" />
                        {error}
                    </p>
                )}
            </div>

            {/* Live terminal — dark block, font-mono allowed for logs only. */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-inner flex flex-col min-h-[250px] max-h-[400px] select-text">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 select-none shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-400 font-sans text-xs">
                        <Terminal className="size-3.5 text-indigo-500" />
                        <span>Terminal Logs</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 rounded-sm border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        {copied ? "Copied!" : "Copy Logs"}
                    </button>
                </div>

                <pre
                    ref={logRef}
                    className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap select-text pr-1"
                >
                    {logs}
                </pre>
            </div>
        </div>
    );
}
