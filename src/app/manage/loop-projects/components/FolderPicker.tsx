"use client";

import React, { useState } from "react";
import { FolderSearch, CornerLeftUp, Folder, Check, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface FolderPickerProps {
    value: string;
    onChange: (path: string) => void;
}

interface DirEntry {
    name: string;
    path: string;
}

// Browse the server's local filesystem to pick an absolute directory path, instead
// of hand-typing it. Pairs with the path Input in the Register/Bootstrap modals.
export function FolderPicker({ value, onChange }: FolderPickerProps) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("");
    const [parent, setParent] = useState<string | null>(null);
    const [dirs, setDirs] = useState<DirEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const load = (target?: string) => {
        setLoading(true);
        setError("");
        const seed = target ?? (value.trim() || "");
        const query = seed ? `?path=${encodeURIComponent(seed)}` : "";
        fetch(`/api/manage/loop-projects/browse${query}`)
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

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (next) load();
    };

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
                <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-sans text-slate-500 break-all">
                    {current || "Loading…"}
                </div>

                <div className="max-h-64 overflow-y-auto p-1">
                    {loading ? (
                        <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
                            <Loader2 className="size-3.5 animate-spin" /> Loading…
                        </div>
                    ) : error ? (
                        <div className="px-2 py-3 text-xs text-red-600">{error}</div>
                    ) : (
                        <>
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
                            {dirs.map((dir) => (
                                <button
                                    key={dir.path}
                                    type="button"
                                    onClick={() => load(dir.path)}
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    <Folder className="size-3.5 text-slate-400" />
                                    <span className="truncate">{dir.name}</span>
                                </button>
                            ))}
                            {dirs.length === 0 && (
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
