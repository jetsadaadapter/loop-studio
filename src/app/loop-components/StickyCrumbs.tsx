"use client";

import React from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

interface StickyCrumbsProps {
    items: Crumb[];
}

// Sticky breadcrumb bar for content shells whose scroll section uses `px-6 py-6`.
// The negative margins let it span the section edges and cancel the top padding
// so it pins flush to the top of the scrollport while the content scrolls under.
export function StickyCrumbs({ items }: StickyCrumbsProps) {
    return (
        <div className="sticky top-0 z-10 -mx-6 -mt-6 border-b border-slate-100 bg-white/95 px-6 py-3 backdrop-blur">
            <Breadcrumbs items={items} />
        </div>
    );
}
