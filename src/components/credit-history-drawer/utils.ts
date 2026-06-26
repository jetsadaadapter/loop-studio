export const TYPE_CONFIG: Record<string, { label: string; iconBg: string; iconText: string; badgeBg: string }> = {
  charge:       { label: "Charge",       iconBg: "bg-rose-100",    iconText: "text-rose-500",    badgeBg: "bg-rose-50 text-rose-500 border-rose-200/60" },
  refund:       { label: "Refund",        iconBg: "bg-sky-100",     iconText: "text-sky-600",     badgeBg: "bg-sky-50 text-sky-600 border-sky-200/60" },
  topup:        { label: "Top-up",        iconBg: "bg-emerald-100", iconText: "text-emerald-600", badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60" },
  admin_adjust: { label: "Adjustment",   iconBg: "bg-amber-100",   iconText: "text-amber-600",   badgeBg: "bg-amber-50 text-amber-600 border-amber-200/60" },
  bonus:        { label: "Bonus",         iconBg: "bg-violet-100",  iconText: "text-violet-600",  badgeBg: "bg-violet-50 text-violet-600 border-violet-200/60" },
};

export const FALLBACK_CFG = { label: "Other", iconBg: "bg-slate-100", iconText: "text-slate-500", badgeBg: "bg-slate-50 text-slate-500 border-slate-200/60" };

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function fmtDayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" });
}

export function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}
