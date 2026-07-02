"use client";

import React from "react";
import { RotateCw, Star, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ProfilePill {
  icon: LucideIcon;
  value: number | string;
  tint: string; // icon color class
}

interface OverviewProfileCardProps {
  name: string;
  position: string;
  image: string | null;
  initials: string;
  ringPercent: number | null;
  pills: ProfilePill[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

function AvatarRing({
  percent,
  image,
  initials,
  name,
}: {
  percent: number | null;
  image: string | null;
  initials: string;
  name: string;
}) {
  const r = 41;
  const c = 2 * Math.PI * r;
  const dash = ((percent ?? 0) / 100) * c;

  return (
    <div className="relative size-[96px]">
      <svg viewBox="0 0 96 96" className="size-full -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        {percent !== null && (
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Avatar className="size-[70px] bg-slate-50">
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback className="bg-brand text-base font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className="absolute bottom-1 right-1 flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-md ring-2 ring-white">
        <Star className="size-3 fill-current" />
      </span>
    </div>
  );
}

export function OverviewProfileCard({
  name,
  position,
  image,
  initials,
  ringPercent,
  pills,
  refreshing,
  onRefresh,
}: OverviewProfileCardProps) {
  return (
    <div className="flex flex-col rounded-[28px] bg-white p-6 ring-1 ring-slate-100 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.20)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">Profile</span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh dashboard"
            className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-brand"
          >
            <RotateCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <AvatarRing
          percent={ringPercent}
          image={image}
          initials={initials}
          name={name}
        />
        <p className="mt-4 text-base font-bold tracking-tight text-slate-900">
          {name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{position}</p>
      </div>

      {pills.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2.5">
          {pills.map(({ icon: Icon, value, tint }, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-800 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.22)]"
            >
              <Icon className={`size-4 ${tint}`} />
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
