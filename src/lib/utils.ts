import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const APP_BADGE_LABEL_MAP: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20",
  trending: "bg-amber-100 text-amber-700 ring-1 ring-amber-500/20",
  hot: "bg-rose-100 text-rose-700 ring-1 ring-rose-500/20",
  "coming soon": "bg-violet-100 text-violet-700 ring-1 ring-violet-500/20",
}

export function getAppBadgeClass(badgeLabel: string): string {
  if (!badgeLabel) return "bg-slate-100 text-slate-700 ring-1 ring-slate-500/20"
  return APP_BADGE_LABEL_MAP[badgeLabel.trim().toLowerCase()] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-500/20"
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

/**
 * Validates if an action link points to an invalid or malformed tool route (e.g. slug instead of ULID).
 */
export function isInvalidToolSlug(link: string): boolean {
  if (!link) return false;

  // Any internal link starting with /to must be a valid tool path (/tool/ or /tools/)
  if (link.startsWith("/to")) {
    if (!link.startsWith("/tool/") && !link.startsWith("/tools/")) {
      return true;
    }
  }

  if (link.startsWith("/tool/") || link.startsWith("/tools/")) {
    const idPart = link.split("/").pop() || "";
    // ULIDs/ObjectIds/Tool IDs are at least 8 chars long and contain no hyphens.
    // If it's short or contains hyphens, it's a slug, which will result in 404.
    if (idPart.length < 8 || idPart.includes("-")) {
      return true;
    }
  }
  return false;
}

/**
 * Validates if an internal link is potentially pointing to a non-existent base path (gibberish/random).
 */
export function isInvalidInternalPath(link: string): boolean {
  if (!link) return false;
  if (!link.startsWith("/")) return true;

  const pathWithoutQuery = link.split("?")[0].split("#")[0];
  const segments = pathWithoutQuery.split("/").filter(Boolean);

  if (segments.length === 0) return false;

  const WHITELISTED_BASE_PATHS = [
    "about",
    "apps",
    "callback",
    "dashboard",
    "images",
    "library",
    "login",
    "manage",
    "tool",
    "tools"
  ];

  const firstSegment = segments[0];
  return !WHITELISTED_BASE_PATHS.includes(firstSegment);
}

/**
 * Validates if a CTA/Action link is safe and valid to click.
 */
export function isValidActionLink(link: string | null | undefined): boolean {
  if (!link) return false;
  const trimmed = link.trim();
  return trimmed.length > 0 && trimmed !== "#" && !isInvalidToolSlug(trimmed);
}
