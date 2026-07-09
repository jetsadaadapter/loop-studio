"use client";

import React, { useState } from "react";
import { FolderSearch, CornerLeftUp, Folder, FolderPlus, Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface FolderPickerProps {
    value: string;
    onChange: (path: string) => void;
}

interface DirEntry {
    name: string;
    path: string;
}

// Browse the server's local filesystem to pick an absolute directory path, with
// light folder management (new / rename / delete-empty) so a fresh workspace
// folder can be organized without leaving the modal.
export function FolderPicker({ value, onChange }: FolderPickerProps) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("");
    const [parent, setParent] = useState<string | null>(null);
    const [dirs, setDirs] = useState<DirEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    // Inline edit state: "new" shows the create row, a path means "renaming that dir".
    const [editing, setEditing] = useState<"new" | string | null>(null);
    const [editName, setEditName] = useState("");
    const [busy, setBusy] = useState(false);

    const load = (target?: string) => {
        setLoading(true);
        setError("");
        setEditing(null);
        const seed = target ?? (value.trim() || "");
        const query = seed ? `?path=${encodeURIComponent(seed)}` : "";
        fetch(`/api/loop-projects/browse${query}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setCurrent(data.data.current);
                    setParent(data.data.parent);
                    setDirs(data.data.dirs);
                } else {
                    setError(data.error || "Failed to browse this folder.");
                }
            })
            .catch(() => setError("Failed to browse this folder."))
            .finally(() => setLoading(false));
    };

    const runAction = async (body: Record<string, string>) => {
        setBusy(true);
        setError("");
        try {
            const res = await fetch("/api/loop-projects/browse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) load(current);
            else setError(data.error || "Folder action failed.");
        } catch {
            setError("Folder action failed due to a network error.");
        } finally {
            setBusy(false);
        }
    };

    const submitEdit = () => {
        if (!editName.trim() || busy) return;
        if (editing === "new") runAction({ action: "mkdir", path: current, name: editName.trim() });
        else if (editing) runAction({ action: "rename", path: editing, newName: editName.trim() });
    };

    const handleDelete = (dir: DirEntry) => {
        if (!confirm(`Delete empty folder "${dir.name}"?`)) return;
        runAction({ action: "delete", path: dir.path });
    };

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (next) load();
    };

    const editRow = (
        <div className="flex items-center gap-1.5 rounded-sm bg-slate-50 px-2 py-1.5">
            <Folder className="size-3.5 shrink-0 text-slate-400" />
            <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); submitEdit(); }
                    if (e.key === "Escape") setEditing(null);
                }}
                placeholder="Folder name"
                className="w-full min-w-0 rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
            <button type="button" onClick={submitEdit} disabled={busy} className="rounded-sm p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 cursor-pointer" title="Save">
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 cursor-pointer" title="Cancel">
                <X className="size-3.5" />
            </button>
        </div>
    );

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                type="button"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-sm border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
            >
                <FolderSearch className="size-3.5" />
                Browse
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                    <span className="min-w-0 flex-1 text-xs font-sans text-slate-500 break-all">{current || "Loading…"}</span>
                    <button
                        type="button"
                        onClick={() => { setEditing("new"); setEditName(""); }}
                        disabled={!current || loading}
                        className="flex shrink-0 items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        title="Create a new folder here"
                    >
                        <FolderPlus className="size-3.5" />
                        New
                    </button>
                </div>

                <div className="max-h-64 overflow-y-auto p-1">
                    {loading ? (
                        <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
                            <Loader2 className="size-3.5 animate-spin" /> Loading…
                        </div>
                    ) : (
                        <>
                            {error && <div className="px-2 py-2 text-xs text-red-600">{error}</div>}
                            {editing === "new" && editRow}
                            {parent && (
                                <button
                                    type="button"
                                    onClick={() => load(parent)}
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    <CornerLeftUp className="size-3.5 text-slate-400" />
                                    Up one level
                                </button>
                            )}
                            {dirs.map((dir) =>
                                editing === dir.path ? (
                                    <div key={dir.path}>{editRow}</div>
                                ) : (
                                    <div key={dir.path} className="group flex items-center rounded-sm hover:bg-slate-50">
                                        <button
                                            type="button"
                                            onClick={() => load(dir.path)}
                                            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs text-slate-700 cursor-pointer"
                                        >
                                            <Folder className="size-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">{dir.name}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setEditing(dir.path); setEditName(dir.name); }}
                                            className="hidden rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 group-hover:block cursor-pointer"
                                            title="Rename folder"
                                        >
                                            <Pencil className="size-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(dir)}
                                            className="mr-1 hidden rounded-sm p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 group-hover:block cursor-pointer"
                                            title="Delete folder (empty only)"
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    </div>
                                ),
                            )}
                            {dirs.length === 0 && editing !== "new" && (
                                <div className="px-2 py-3 text-xs text-slate-400">No sub-folders here.</div>
                            )}
                        </>
                    )}
                </div>

                <div className="border-t border-slate-100 p-2">
                    <button
                        type="button"
                        disabled={!current}
                        onClick={() => {
                            onChange(current);
                            setOpen(false);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-brand py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 cursor-pointer"
                    >
                        <Check className="size-3.5" />
                        Use this folder
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
