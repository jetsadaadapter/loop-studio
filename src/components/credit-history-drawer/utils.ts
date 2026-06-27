import { Layers, TrendingDown, TrendingUp } from "lucide-react";
import type { CreditTransaction } from "@/core/services/users.service";

export const FILTER_TABS = [
  { key: "all",     label: "All",     icon: Layers },
  { key: "charges", label: "Charges", icon: TrendingDown },
  { key: "refunds", label: "Refunds", icon: TrendingUp },
] as const;

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

export function getAvailableMonths(items: CreditTransaction[]): number[] {
  const set = new Set<number>();
  items.forEach((tx) => set.add(new Date(tx.createdAt).getMonth()));
  return Array.from(set).sort((a, b) => a - b);
}

export function filterAndSortTransactions(
  items: CreditTransaction[],
  filter: "all" | "charges" | "refunds",
  selectedMonth: number | null
): CreditTransaction[] {
  return items
    .filter((tx) => {
      if (filter === "charges") return tx.amount < 0;
      if (filter === "refunds") return tx.amount > 0;
      return true;
    })
    .filter((tx) => {
      if (selectedMonth === null) return true;
      return new Date(tx.createdAt).getMonth() === selectedMonth;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function groupTransactionsByDay(filtered: CreditTransaction[]) {
  const groups: { label: string; txs: CreditTransaction[] }[] = [];
  filtered.forEach((tx) => {
    const last = groups[groups.length - 1];
    if (last && isSameDay(tx.createdAt, last.txs[0].createdAt)) {
      last.txs.push(tx);
    } else {
      groups.push({ label: fmtDayLabel(tx.createdAt), txs: [tx] });
    }
  });
  return groups;
}


export function getHeaderStyles(currentBalance: number | null, usedTotal: number) {
  const total = currentBalance ?? 0;
  const budget = total + usedTotal;
  const remainingPct = budget > 0 ? Math.floor((total / budget) * 100) : 100;
  const spentPct = 100 - remainingPct;

  const isDepleted = total === 0;
  const isLow = !isDepleted && remainingPct <= 20;

  const headerBgClass = isDepleted
    ? "bg-rose-50/60 dark:bg-rose-950/15 backdrop-blur-md border-b border-rose-100 dark:border-rose-900/20"
    : isLow
      ? "bg-gradient-to-br from-rose-500/8 via-rose-500/2 to-orange-500/6 dark:from-rose-500/15 dark:via-rose-500/5 dark:to-orange-500/10 backdrop-blur-md border-b border-rose-100/80 dark:border-rose-950/40"
      : "bg-gradient-to-br from-orange-500/6 via-amber-500/2 to-yellow-500/6 dark:from-orange-500/12 dark:via-amber-500/4 dark:to-yellow-500/8 backdrop-blur-md border-b border-amber-100/70 dark:border-amber-950/30";

  const accentColorClass = isDepleted || isLow
    ? "text-rose-500 dark:text-rose-400"
    : "text-[#c20019] dark:text-rose-500";

  return { total, budget, spentPct, headerBgClass, accentColorClass };
}
