"use client";

import React, { useState, useEffect } from "react";
import { GitCommit, ArrowUpCircle, Eye, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GitWorkspaceProps {
    projectId: string;
    taskId: string;
    onTriggerLog: () => void;
}

export function GitWorkspace({ projectId, taskId, onTriggerLog }: GitWorkspaceProps) {
    const [gitInfo, setGitInfo] = useState<{ branch: string; commit: string; modifiedFiles: string[] }>({
        branch: "...",
        commit: "...",
        modifiedFiles: [],
    });
    const [diff, setDiff] = useState("");
    const [commitMessage, setCommitMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");

    const loadGitData = async () => {
        try {
            const iRes = await fetch(`/api/loop-projects/${projectId}/git-info`);
            const iData = await iRes.json();
            if (iData.success) {
                setGitInfo(iData.data);
            }

            const dRes = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/diff`);
            const dData = await dRes.json();
            if (dData.success) {
                setDiff(dData.data || "No modifications detected. Working tree clean.");
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadGitData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, taskId]);

    const handleCommit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commitMessage.trim()) return;
        setLoading(true);
        setResult("Executing git commit...");

        try {
            const res = await fetch(`/api/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "commit", commitMessage })
            });
            const data = await res.json();
            if (data.success) {
                setResult("Changes committed successfully!");
                setCommitMessage("");
                loadGitData();
            } else {
                setResult(`Commit failed: ${data.error}`);
            }
        } catch (e) {
            setResult(`Commit error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePush = async () => {
        setLoading(true);
        setResult("Executing git push origin...");
        onTriggerLog();

        try {
            const res = await fetch(`/api/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "push" })
            });
            const data = await res.json();
            if (data.success) {
                setResult(`Successfully pushed! ${data.message}`);
                loadGitData();
            } else {
                setResult(`Push failed: ${data.error}`);
            }
        } catch (e) {
            setResult(`Push error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setLoading(false);
        }
    };

    // Parse git diff line by line to highlight additions and deletions
    const renderDiffLine = (line: string, index: number) => {
        let lineClass = "text-slate-600";
        if (line.startsWith("+") && !line.startsWith("+++")) {
            lineClass = "bg-emerald-50 text-emerald-800 font-medium border-l-2 border-emerald-500 pl-1";
        } else if (line.startsWith("-") && !line.startsWith("---")) {
            lineClass = "bg-red-50 text-red-800 font-medium border-l-2 border-red-500 pl-1";
        } else if (line.startsWith("@@")) {
            lineClass = "text-indigo-400 font-semibold bg-indigo-50/30";
        } else if (line.startsWith("diff") || line.startsWith("index")) {
            lineClass = "text-slate-400 font-semibold border-t border-slate-800 mt-2 pt-1";
        }

        return (
            <div key={index} className={`font-mono text-xs py-0.5 px-2 leading-relaxed select-text truncate ${lineClass}`}>
                {line}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Git Status / Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-lg text-xs">
                <div className="flex items-center gap-1.5 font-sans">
                    <span className="text-slate-400">Branch:</span>
                    <span className="font-semibold text-slate-800">{gitInfo.branch}</span>
                    <span className="text-slate-400 font-sans">({gitInfo.commit})</span>
                </div>
                
                <button
                    onClick={loadGitData}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                    <RefreshCw className="size-3" />
                    Sync Status
                </button>
            </div>

            {/* Staging / Commit Form */}
            {gitInfo.modifiedFiles.length > 0 && (
                <div className="border border-slate-200 bg-white rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-1.5">
                        <GitCommit className="size-4 text-indigo-600" />
                        <h4 className="font-semibold text-slate-800 text-xs">Commit Workspace Modifications</h4>
                    </div>
                    
                    <form onSubmit={handleCommit} className="space-y-2">
                        <Input
                            type="text"
                            required
                            placeholder="Enter commit message... (e.g. feat: add round option to button)"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            className="h-auto rounded-lg px-3 py-2 text-xs focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handlePush}
                                disabled={loading}
                                className="flex items-center gap-1 rounded-sm border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 cursor-pointer shadow-3xs"
                            >
                                <ArrowUpCircle className="size-3.5" />
                                Publish
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !commitMessage.trim()}
                                className="flex items-center gap-1 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                                <GitCommit className="size-3.5" />
                                Commit All
                            </button>
                        </div>
                    </form>
                    
                    {result && (
                        <p className="text-xs font-sans font-medium text-indigo-600">{result}</p>
                    )}
                </div>
            )}

            {/* Git Diff View */}
            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-3xs flex flex-col max-h-[300px]">
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 font-sans text-xs">
                        <Eye className="size-4 text-indigo-600" />
                        <span>Unified Diff Preview</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-2 whitespace-pre leading-relaxed select-text pr-1">
                    {diff ? (
                        diff.split("\n").map((line, idx) => renderDiffLine(line, idx))
                    ) : (
                        <div className="text-slate-500 text-xs p-4 font-sans text-center">Loading git diff files...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
