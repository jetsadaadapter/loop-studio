"use client";

// Top strip for the API console: Postman import + Save-check + History/Checks
// panel toggles. Kept separate so ApiConsole stays lean.
import type { ReactNode } from "react";
import { Upload, X, Clock, ListChecks, Save } from "lucide-react";

function Toggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex cursor-pointer items-center gap-1 rounded-sm border px-2 py-1 text-[11px] font-semibold font-sans transition-colors ${
                active ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:text-slate-700"
            }`}
        >
            {icon} {label}
        </button>
    );
}

export function ApiToolbar({
    collectionName,
    endpointCount,
    historyCount,
    panel,
    onHistory,
    onChecks,
    onImport,
    onClearCollection,
    onSaveCheck,
}: {
    collectionName?: string;
    endpointCount: number;
    historyCount: number;
    panel: string;
    onHistory: () => void;
    onChecks: () => void;
    onImport: () => void;
    onClearCollection: () => void;
    onSaveCheck: () => void;
}) {
    return (
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-1.5">
            {collectionName ? (
                <>
                    <span className="truncate text-[11px] font-semibold font-sans text-slate-700">{collectionName}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-sans text-slate-500">{endpointCount} endpoints</span>
                    <button type="button" onClick={onImport} className="cursor-pointer text-[11px] font-semibold font-sans text-indigo-600 hover:text-indigo-700">
                        เปลี่ยน
                    </button>
                    <button
                        type="button"
                        onClick={onClearCollection}
                        aria-label="ล้าง collection"
                        className="flex size-5 cursor-pointer items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="size-3.5" />
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    onClick={onImport}
                    className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-slate-200 px-2.5 py-1 text-[11px] font-semibold font-sans text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                >
                    <Upload className="size-3.5" /> Import Postman
                </button>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <button
                    type="button"
                    onClick={onSaveCheck}
                    title="บันทึก request ปัจจุบันเป็น check"
                    className="flex cursor-pointer items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-[11px] font-semibold font-sans text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                >
                    <Save className="size-3.5" /> Save check
                </button>
                <Toggle active={panel === "history"} onClick={onHistory} icon={<Clock className="size-3.5" />} label={`History${historyCount > 0 ? ` (${historyCount})` : ""}`} />
                <Toggle active={panel === "checks"} onClick={onChecks} icon={<ListChecks className="size-3.5" />} label="Checks" />
            </div>
        </div>
    );
}
