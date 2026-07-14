"use client";

import React from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

interface StickyCrumbsProps {
    items: Crumb[];
}

// Sticky breadcrumb bar for content shells whose scroll section uses
// `px-6 pb-6` (no top padding — the bar's own py-3 provides it). The negative
// horizontal margin lets it span the section edges; it pins flush to the top of
// the scrollport (text at 12px, matching the other shells) while content scrolls under.
export function StickyCrumbs({ items }: StickyCrumbsProps) {
    return (
        <div className="sticky top-0 z-20 -mx-6 border-b border-slate-100 bg-white px-3 py-3">
            <Breadcrumbs items={items} />
        </div>
    );
}
