"use client";

import React, { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { ProjectSchedule } from "@/core/interfaces/loop-projects.interface";

interface ScheduleModalProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    onSaved: () => void;
}

const INTERVAL_OPTIONS: { label: string; minutes: number }[] = [
    { label: "15 min", minutes: 15 },
    { label: "30 min", minutes: 30 },
    { label: "1 hour", minutes: 60 },
    { label: "3 hours", minutes: 180 },
    { label: "6 hours", minutes: 360 },
    { label: "Daily", minutes: 1440 },
];

export function ScheduleModal({ isOpen, projectId, onClose, onSaved }: ScheduleModalProps) {
    const [enabled, setEnabled] = useState(false);
    const [intervalMinutes, setIntervalMinutes] = useState(60);
    const [existing, setExisting] = useState<ProjectSchedule | null>(null);
    const [busy, setBusy] = useState<"save" | null>(null);
    const [error, setError] = useState("");

    // Load the current schedule when the modal opens. setState is only called
    // inside the async callbacks (never synchronously in the effect body).
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        fetch(`/api/loop-projects/${projectId}/schedule`)
            .then((res) => res.json())
            .then((json) => {
                if (cancelled) return;
                setError("");
                if (json.success && json.data) {
                    const s = json.data as ProjectSchedule;
                    setExisting(s);
                    setEnabled(s.enabled);
                    setIntervalMinutes(s.intervalMinutes);
                } else {
                    setExisting(null);
                    setEnabled(false);
                    setIntervalMinutes(60);
                }
            })
            .catch(() => { if (!cancelled) setError("Could not load the current schedule."); });
        return () => { cancelled = true; };
    }, [isOpen, projectId]);

    const save = async () => {
        setBusy("save");
        setError("");
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/schedule`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled, intervalMinutes }),
            });
            const json = await res.json();
            if (!json.success) {
                setError(json.error || "Failed to save the schedule.");
                return;
            }
            onSaved();
            onClose();
        } catch {
            setError("Failed to save the schedule due to a network error.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                hideCloseButton
                className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Clock className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Auto-Run Schedule</h2>
                    </div>
                    <ModalCloseButton onClose={onClose} disabled={!!busy} />
                </div>

                <div className="space-y-4 px-5 py-4">
                    <Field>
                        <div className="flex items-center justify-between">
                            <FieldLabel htmlFor="schedule-enabled">Run the backlog automatically</FieldLabel>
                            <Switch
                                id="schedule-enabled"
                                checked={enabled}
                                onCheckedChange={(v: boolean) => setEnabled(v)}
                                disabled={!!busy}
                            />
                        </div>
                        <FieldDescription>
                            On each interval the server drains pending backlog tasks. Headless runs use the
                            server API key (ANTHROPIC_API_KEY / GEMINI_API_KEY) — with none set, the run is skipped.
                        </FieldDescription>
                    </Field>

                    <Field>
                        <FieldLabel>Interval</FieldLabel>
                        <div className="flex flex-wrap gap-1.5">
                            {INTERVAL_OPTIONS.map((opt) => (
                                <button
                                    key={opt.minutes}
                                    type="button"
                                    onClick={() => setIntervalMinutes(opt.minutes)}
                                    disabled={!enabled || !!busy}
                                    className={`rounded-sm border px-2.5 py-1 text-xs font-semibold font-sans transition-colors disabled:opacity-40 cursor-pointer ${
                                        intervalMinutes === opt.minutes
                                            ? "border-brand bg-brand/10 text-brand"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </Field>

                    {existing?.lastRunAt && (
                        <p className="text-[11px] text-slate-500 font-sans">
                            Last checked {new Date(existing.lastRunAt).toLocaleString()}
                            {existing.lastResult ? ` — ${existing.lastResult}` : ""}
                        </p>
                    )}

                    {error && <FieldError>{error}</FieldError>}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                    <button
                        onClick={onClose}
                        disabled={!!busy}
                        className="rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={!!busy}
                        className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                        {busy === "save" ? <Loader2 className="size-3.5 animate-spin" /> : <Clock className="size-3.5" />}
                        Save Schedule
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
