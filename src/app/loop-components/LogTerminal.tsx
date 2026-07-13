"use client";

import React, { useEffect, useState, useRef } from "react";
import { Terminal, Copy, Check } from "lucide-react";

interface LogTerminalProps {
    projectId: string;
    taskId: string;
    triggerCount: number; // used to reload/re-subscribe when a test is executed
}

export function LogTerminal({ projectId, taskId, triggerCount }: LogTerminalProps) {
    const [logs, setLogs] = useState("No execution logs yet.\n");
    const [copied, setCopied] = useState(false);
    const logRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLogs("Connecting log stream...\n");
        const eventSource = new EventSource(`/api/loop-projects/${projectId}/tasks/${taskId}/logs`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.text) {
                    setLogs((prev) => {
                        // Avoid duplicates of initial load if any, but standard stream append is safe
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

    const handleCopy = () => {
        navigator.clipboard.writeText(logs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-inner flex flex-col h-full min-h-0 select-text">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 select-none shrink-0">
                <div className="flex items-center gap-1.5 text-slate-400 font-sans text-xs">
                    <Terminal className="size-3.5 text-indigo-500" />
                    <span>Terminal Logs</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-sm border border-slate-800 bg-slate-900 px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                >
                    {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    {copied ? "Copied!" : "Copy Logs"}
                </button>
            </div>
            
            <pre
                ref={logRef}
                className="flex-1 overflow-y-auto font-sans text-2xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text pr-1"
            >
                {logs}
            </pre>
        </div>
    );
}
