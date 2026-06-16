"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  Archive,
  CalendarRange,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { cn } from "@/lib/utils";
import type { AppBannerCardProps } from "./types";

function getScheduleStatus(startsAt?: string | null, endsAt?: string | null) {
  const now = Date.now();
  const start = startsAt ? new Date(startsAt).getTime() : null;
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (start && start > now) {
    return {
      label: `Starts ${format(new Date(start), "MMM d")}`,
      icon: Clock,
      color: "bg-amber-50 text-amber-600 border-amber-200",
    };
  }
  if (end && end < now) {
    return {
      label: `Ended ${format(new Date(end), "MMM d")}`,
      icon: Archive,
      color: "bg-zinc-100 text-zinc-500 border-zinc-200",
    };
  }
  if (start && end) {
    return {
      label: `${format(new Date(start), "MMM d")} – ${format(new Date(end), "MMM d")}`,
      icon: CalendarRange,
      color: "bg-sky-50 text-sky-600 border-sky-200",
    };
  }
  return {
    label: "Always on",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };
}

export default function AppBannerCard({ banner, onEdit, onDelete }: AppBannerCardProps) {
  const { title, subtitle, app, imageId, isActive, sortOrder, startsAt, endsAt } = banner;
  const [imgError, setImgError] = useState(false);

  const schedule = getScheduleStatus(startsAt, endsAt);
  const ScheduleIcon = schedule.icon;

  const imageSrc =
    imageId && !imgError ? `/images/${encodeURIComponent(imageId.trim())}` : null;

  const iconSrc = app.iconId ? `/images/${encodeURIComponent(app.iconId.trim())}` : null;

  return (
    <Card className="group flex flex-col overflow-hidden p-0 border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] bg-white rounded-2xl">
      {/* Image */}
      <div className="p-2 pb-0 shrink-0">
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl">
          <div className="absolute inset-0 animate-pulse bg-muted" />

          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="relative z-10 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400/40">
                No image
              </span>
            </div>
          )}

          {/* Actions overlay */}
          <div className="absolute right-2 top-2 z-20">
            <ManagerActionsDropdown
              ariaLabel={`Open actions for ${title}`}
              triggerSize="icon-sm"
              triggerClassName="flex size-8 items-center justify-center rounded-full border-0 bg-black/40 p-0 text-white shadow-none backdrop-blur-md transition hover:bg-black/60 aria-expanded:bg-black/60"
              actions={[
                {
                  label: "Edit",
                  icon: Pencil,
                  onClick: (e) => { e.stopPropagation(); onEdit?.(); },
                },
                {
                  label: "Delete",
                  icon: Trash2,
                  onClick: (e) => { e.stopPropagation(); onDelete?.(); },
                  variant: "destructive",
                  showSeparatorBefore: true,
                },
              ]}
            />
          </div>

          {/* Status/Active badge */}
          {!isActive && (
            <div className="absolute left-2 top-2 z-20">
              <span className="rounded-md border border-zinc-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 backdrop-blur-sm">
                Inactive
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        {/* App header row */}
        <div className="mb-2 flex items-center gap-2">
          <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600">
            {iconSrc ? (
              <Image src={iconSrc} alt={app.name || ""} fill className="object-cover" unoptimized />
            ) : (
              <LayoutGrid className="size-3 text-white" />
            )}
          </div>
          <span className="truncate text-[13px] font-bold text-zinc-900">
            {app.name || "Unknown App"}
          </span>
        </div>

        {/* Title + Subtitle */}
        <p className="mb-3 line-clamp-2 text-[13px] leading-snug text-zinc-600">
          {title && <span className="font-semibold text-zinc-900 mr-1">{title}.</span>}
          {subtitle}
        </p>

        {/* Badges */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              schedule.color,
            )}
          >
            <ScheduleIcon className="size-3" />
            {schedule.label}
          </span>

          {app.category?.name && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              {app.category.name}
            </span>
          )}

          {app.badgeLabel && (
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-600">
              {app.badgeLabel}
            </span>
          )}
        </div>

        {/* Divider + sort order */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-400">Sort order</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            #{sortOrder}
          </span>
        </div>
      </div>
    </Card>
  );
}
