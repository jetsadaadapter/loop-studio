"use client";

// Top header for the API console: bold title + subtitle on the left, pill-shaped
// action buttons on the right (Postman import + Save-check + History/Checks panel
// toggles). Kept separate so ApiConsole stays lean.
import type { ReactNode } from "react";
import { Upload, X, Clock, ListChecks, Save } from "lucide-react";

function Pill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold font-sans transition-colors ${
                active ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div className="min-w-0">
                <h2 className="truncate text-sm font-bold tracking-tight text-slate-900 font-sans">
                    {collectionName ?? "API Console"}
                </h2>
                <p className="truncate text-xs text-slate-500 font-sans">
                    {collectionName ? `${endpointCount} endpoint${endpointCount === 1 ? "" : "s"} imported` : "Import a Postman collection to browse and test endpoints"}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {collectionName && (
                    <Pill active={panel === "checks"} onClick={onChecks} icon={<ListChecks className="size-3.5" />} label="Checks" />
                )}
                {collectionName && (
                    <Pill
                        active={panel === "history"}
                        onClick={onHistory}
                        icon={<Clock className="size-3.5" />}
                        label={`History${historyCount > 0 ? ` · ${historyCount}` : ""}`}
                    />
                )}
                <button
                    type="button"
                    onClick={onSaveCheck}
                    title="บันทึก request ปัจจุบันเป็น check"
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold font-sans text-slate-600 hover:bg-slate-50"
                >
                    <Save className="size-3.5" /> Save check
                </button>
                <button
                    type="button"
                    onClick={onImport}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold font-sans text-white hover:bg-slate-800"
                >
                    <Upload className="size-3.5" /> {collectionName ? "เปลี่ยน collection" : "Import Postman"}
                </button>
                {collectionName && (
                    <button
                        type="button"
                        onClick={onClearCollection}
                        aria-label="ล้าง collection"
                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
