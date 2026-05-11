import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STATUS_BADGE: Record<string, string> = {
  new: "bg-red-100 text-red-700",
  "production ready": "bg-emerald-100 text-emerald-700",
  "in rollout": "bg-amber-100 text-amber-800",
  beta: "bg-sky-100 text-sky-800",
}

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE[status.toLowerCase()] ?? "bg-slate-100 text-slate-700"
}

const DEPARTMENT_BADGE_MAP: Record<string, string> = {
  creative: "bg-rose-600 text-white ring-rose-700/10",
  technology: "bg-indigo-600 text-white ring-indigo-700/10",
  media: "bg-emerald-600 text-white ring-emerald-700/10",
  strategy: "bg-amber-600 text-white ring-amber-700/10",
  "client service": "bg-sky-600 text-white ring-sky-700/10",
  admin: "bg-violet-600 text-white ring-violet-700/10",
  management: "bg-orange-600 text-white ring-orange-700/10",
  innovation: "bg-teal-600 text-white ring-teal-700/10",
}

export function getDepartmentBadgeClass(dept: string): string {
  const normalized = dept?.trim().toLowerCase()
  return (
    DEPARTMENT_BADGE_MAP[normalized] || "bg-slate-600 text-white ring-slate-700/10"
  )
}
