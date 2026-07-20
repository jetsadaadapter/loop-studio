"use client";

import React, { useState } from "react";
import { GitBranch, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface ConnectGitModalProps {
    projectId: string;
    open: boolean;
    onClose: () => void;
    /** Refetch git info once the repo is connected. */
    onConnected: () => void;
}

// Initializes a git repository for a project that isn't under version control yet
// (POST git-action { action: "init" }). Unlocks commit/push, the version timeline,
// and per-task worktree isolation. Remote linking is optional.
export function ConnectGitModal({ projectId, open, onClose, onConnected }: ConnectGitModalProps) {
    const [initialCommit, setInitialCommit] = useState(true);
    const [remoteUrl, setRemoteUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [warning, setWarning] = useState("");
    const [done, setDone] = useState(false);

    const reset = () => { setRemoteUrl(""); setInitialCommit(true); setError(""); setWarning(""); setDone(false); };
    const close = () => { reset(); onClose(); };

    const handleConnect = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/git-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "init", initialCommit, remoteUrl: remoteUrl.trim() || undefined }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || "Failed to connect git.");
                return;
            }
            onConnected();
            if (data.warning) {
                setWarning(data.warning);
                setDone(true); // keep the dialog open so the note is read
            } else {
                close();
            }
        } catch {
            setError("Network error while connecting git.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && close()}>
            <DialogContent
                hideCloseButton
                className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <GitBranch className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Connect Git</h2>
                    </div>
                    <ModalCloseButton onClose={close} />
                </div>

                <div className="space-y-4 px-5 py-4">
                    {done ? (
                        <div className="space-y-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                <CheckCircle2 className="size-4" /> Repository initialized
                            </p>
                            <p className="flex items-start gap-1.5 text-xs text-amber-700 font-sans">
                                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                                {warning}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-slate-500 font-sans leading-relaxed">
                                This project isn&apos;t under version control yet. Initializing a repository unlocks
                                commit &amp; push, the version timeline, and per-task worktree isolation.
                            </p>

                            <Field>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <FieldLabel htmlFor="git-initial-commit">Create an initial commit</FieldLabel>
                                        <FieldDescription>
                                            Commits the current files (your <span className="font-mono text-slate-600">.gitignore</span> is respected, so <span className="font-mono text-slate-600">node_modules</span> stays out).
                                        </FieldDescription>
                                    </div>
                                    <Switch id="git-initial-commit" checked={initialCommit} onCheckedChange={setInitialCommit} className="mt-0.5 shrink-0" />
                                </div>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="git-remote">Remote URL <span className="font-normal text-slate-400 lowercase tracking-normal">(optional)</span></FieldLabel>
                                <Input
                                    id="git-remote"
                                    value={remoteUrl}
                                    onChange={(e) => setRemoteUrl(e.target.value)}
                                    placeholder="git@github.com:you/repo.git"
                                />
                                <FieldDescription>
                                    Sets <span className="font-mono text-slate-600">origin</span> so you can push. Pushing itself needs your own git credentials (e.g. an authenticated <span className="font-mono text-slate-600">gh</span> / SSH key).
                                </FieldDescription>
                            </Field>

                            {error && <FieldError>{error}</FieldError>}
                        </>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        {done ? (
                            <button type="button" onClick={close} className="rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm">
                                Done
                            </button>
                        ) : (
                            <>
                                <button type="button" onClick={close} className="rounded-sm border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConnect}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm"
                                >
                                    {loading && <Loader2 className="size-3.5 animate-spin" />}
                                    Initialize repository
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
