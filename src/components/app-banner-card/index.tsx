"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Ellipsis,
  Pencil,
  Trash2,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppBadgeClass } from "@/lib/utils";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import type { AppBannerCardProps } from "./types";

export default function AppBannerCard({
  banner,
  onEdit,
  onDelete,
}: AppBannerCardProps) {
  const { title, subtitle, app, imageId, startsAt, endsAt } = banner;
  const [now] = useState(() => Date.now());

  const getStatusPresentation = () => {
    const start = startsAt ? new Date(startsAt).getTime() : 0;
    const end = endsAt ? new Date(endsAt).getTime() : Infinity;

    if (startsAt && start > now) {
      const timeStr = new Date(start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return {
        label: `Scheduled for ${timeStr}`,
        icon: Clock,
        color: "text-amber-600 bg-amber-50 border-amber-200",
      };
    }
    if (endsAt && end < now) {
      const dateStr = new Date(end).toLocaleDateString();
      return {
        label: `Ended on ${dateStr}`,
        icon: Archive,
        color: "text-zinc-500 bg-zinc-50 border-zinc-200",
      };
    }

    let label = "Active";
    if (startsAt) {
      const timeStr = new Date(start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      label = `Posted on ${timeStr} Today`; // Simplification for UI look
    }

    return {
      label,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    };
  };

  const status = getStatusPresentation();
  const StatusIcon = status.icon;

  const imageSrc = imageId
    ? `/images/${encodeURIComponent(imageId.trim())}`
    : "/images/media-mix-abstract.png";

  const iconSrc = app.iconId
    ? `/images/${encodeURIComponent(app.iconId.trim())}`
    : null;

  const tagsList = app.tags && app.tags.length > 0
    ? app.tags.map((t) => (typeof t === "string" ? t : t.name)).join(", ")
    : "-";

  return (
    <div className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-zinc-100 overflow-hidden relative flex flex-col font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center bg-blue-600 rounded-full w-5 h-5 overflow-hidden">
            {iconSrc ? (
              <Image
                src={iconSrc}
                alt={app.name || "App icon"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <LayoutGrid className="w-3 h-3 text-white" />
            )}
          </div>
          <span className="font-bold text-zinc-900 text-[14px] tracking-tight">
            {app.name || "App Name"}
          </span>
        </div>

        {/* Action Buttons */}
        <ManagerActionsDropdown
          ariaLabel={`Open actions for ${title}`}
          triggerSize="icon-sm"
          triggerClassName="flex size-7 items-center justify-center rounded-full border-0 bg-transparent p-0 text-zinc-400 shadow-none transition hover:bg-zinc-100 hover:text-zinc-900 aria-expanded:bg-zinc-100"
          actions={[
            {
              label: "Edit",
              icon: Pencil,
              onClick: (e) => {
                e.stopPropagation();
                onEdit?.();
              },
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: (e) => {
                e.stopPropagation();
                onDelete?.();
              },
              variant: "destructive",
              showSeparatorBefore: true,
            },
          ]}
        />
      </div>

      {/* Title / Subtitle Text */}
      <div className="px-4 pb-3">
        <p className="text-[13px] text-zinc-700 leading-snug line-clamp-2">
          {title && <span className="font-semibold text-zinc-900 mr-1">{title}.</span>}
          {subtitle}
        </p>
      </div>

      {/* Image Section */}
      <div className="px-4 relative flex flex-col items-center">
        <div className="relative w-full aspect-[16/10] bg-[#90b0c1] rounded-xl overflow-hidden shadow-sm">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Status Label Overlay */}
        <div className="flex justify-end w-full -mt-3.5 pr-2 relative z-10">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm text-[11px] font-bold tracking-tight bg-white ${status.color}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </div>
        </div>
      </div>

      {/* Bottom Lines Section */}
      <div className="mt-2 border-t-2 border-t border-zinc-100 bg-white px-4">
        <div className="flex items-center justify-between px-0 py-2 border-b border-zinc-100">
          <span className="text-zinc-900 text-xs font-bold tracking-tight">Category</span>
          <span className="text-zinc-900 text-xs font-semibold">
            {app.category?.name || "-"}
          </span>
        </div>
        <div className="flex items-center justify-between px-0 py-2 border-b border-zinc-100">
          <span className="text-zinc-500 text-xs font-medium tracking-tight">Tags</span>
          <span className="text-zinc-900 text-xs font-semibold line-clamp-1 text-right ml-4">
            {tagsList}
          </span>
        </div>
        <div className="flex items-center justify-between px-0 pt-2 pb-3.5">
          <span className="text-zinc-500 text-xs font-medium tracking-tight">Highlight</span>
          <span className="text-zinc-900 text-xs font-bold">
            {app.badgeLabel ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium leading-tight ${getAppBadgeClass(app.badgeLabel)}`}>
                {app.badgeLabel}
              </span>
            ) : (
              "-"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
