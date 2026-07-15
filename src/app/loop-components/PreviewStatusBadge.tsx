"use client";

import React, { useState } from "react";
import { Check, AlertTriangle, Info } from "lucide-react";

export type CheckState = "pass" | "fail" | "idle";

const STATUS_INFO: Record<string, { title: string; pass: string; fail: string }> = {
    Verify: {
        title: "Linting & Type Check",
        pass: "ESLint and TypeScript checks passed. Code is clean.",
        fail: "ESLint or TypeScript found errors. Run \"npm run lint\" or \"npx tsc\" in the project to see details, then fix the errors and re-run the task.",
    },
    Build: {
        title: "Production Build",
        pass: "Build succeeded — app is deployable.",
        fail: "Build failed. Run \"npm run build\" to see the error log. Common causes: missing imports, type errors, or env variable issues. Fix and re-trigger the pipeline.",
    },
};

/** Pipeline status pill (Verify/Build) with a hover tooltip explaining the state. */
export function StatusBadge({ label, state }: { label: string; state: CheckState }) {
    const [show, setShow] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const info = STATUS_INFO[label];
    if (state === "idle") return null;

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        setRect(e.currentTarget.getBoundingClientRect());
        setShow(true);
    };

    return (
        <span>
            <button
                type="button"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setShow(false)}
                onFocus={(e) => { setRect(e.currentTarget.getBoundingClientRect()); setShow(true); }}
                onBlur={() => setShow(false)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold font-sans uppercase border transition-colors cursor-help select-none ${
                    state === "pass"
                        ? "text-[#499A13] bg-[#499A13]/5 border-[#499A13]/20 hover:bg-[#499A13]/10"
                        : "text-red-700 bg-red-50 border-red-200/60 hover:bg-red-100/60"
                }`}
            >
                {state === "pass" ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
                {label}
            </button>
            {show && info && rect && (
                <div
                    style={{
                        position: "fixed",
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right,
                        zIndex: 9999,
                    }}
                    className="w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl text-left pointer-events-none"
                >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                        <Info className="size-3" /> {info.title}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                        {state === "pass" ? info.pass : info.fail}
                    </p>
                </div>
            )}
        </span>
    );
}
