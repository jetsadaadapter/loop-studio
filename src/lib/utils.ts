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
