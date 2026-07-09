"use client";

import React from "react";
import { Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

interface AppFooterProps {
    /** Optional extra content (e.g. an attribution line) shown on the right. */
    children?: React.ReactNode;
    className?: string;
}

// Subtle content footer: app identity + version on the left, optional extras
// on the right. Pass `mt-auto` (from the caller) to anchor it to the bottom.
export function AppFooter({ children, className }: AppFooterProps) {
    return (
        <footer
            className={cn(
                "flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 font-sans sm:flex-row",
                className,
            )}
        >
            <span className="flex items-center gap-1.5">
                <Workflow className="size-3.5 text-slate-300" />
                Loop Studio
                <span className="text-slate-300">·</span>
                <span>v{APP_VERSION}</span>
            </span>
            {children}
        </footer>
    );
}
