"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coins, ArrowDownRight, ArrowUpRight, X, RefreshCw,
  TrendingDown, TrendingUp, Layers,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCreditHistory } from "@/core/services/users.service";
import type { CreditTransaction } from "@/core/services/users.service";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; iconBg: string; iconText: string; badgeBg: string }> = {
  charge:       { label: "Charge",       iconBg: "bg-rose-100",    iconText: "text-rose-500",    badgeBg: "bg-rose-50 text-rose-500 border-rose-200/60" },
  refund:       { label: "Refund",        iconBg: "bg-sky-100",     iconText: "text-sky-600",     badgeBg: "bg-sky-50 text-sky-600 border-sky-200/60" },
  topup:        { label: "Top-up",        iconBg: "bg-emerald-100", iconText: "text-emerald-600", badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60" },
  admin_adjust: { label: "Adjustment",   iconBg: "bg-amber-100",   iconText: "text-amber-600",   badgeBg: "bg-amber-50 text-amber-600 border-amber-200/60" },
  bonus:        { label: "Bonus",         iconBg: "bg-violet-100",  iconText: "text-violet-600",  badgeBg: "bg-violet-50 text-violet-600 border-violet-200/60" },
};
const FALLBACK_CFG = { label: "Other", iconBg: "bg-slate-100", iconText: "text-slate-500", badgeBg: "bg-slate-50 text-slate-500 border-slate-200/60" };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" });
}
function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: CreditTransaction }) {
  const isCredit = tx.amount > 0;
  const cfg = TYPE_CONFIG[tx.type] ?? FALLBACK_CFG;
  const initials = tx.type.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Time */}
      <span className="w-14 shrink-0 text-[10px] font-medium text-slate-400 tabular-nums text-right">
        {fmtTime(tx.createdAt)}
      </span>
      {/* Icon */}
      <div className={`relative shrink-0 flex size-9 items-center justify-center rounded-full text-[10px] font-bold ${cfg.iconBg} ${cfg.iconText}`}>
        {initials}
        <span className={`absolute -bottom-0.5 -right-0.5 flex size-[14px] items-center justify-center rounded-full border-2 border-white ${isCredit ? "bg-emerald-500" : "bg-rose-500"}`}>
          {isCredit
            ? <ArrowUpRight className="size-2 text-white" />
            : <ArrowDownRight className="size-2 text-white" />
          }
        </span>
      </div>
      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-slate-800 leading-snug truncate">{tx.description}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          {tx.clientType && (
            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">
              {tx.clientType}
            </span>
          )}
          <span className={`inline-flex items-center rounded border px-1.5 text-[8px] font-bold uppercase tracking-wide ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
        </div>
      </div>
      {/* Amount */}
      <span className={`shrink-0 text-sm font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-rose-500"}`}>
        {isCredit ? "+" : ""}{tx.amount.toLocaleString()}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CreditHistoryDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentBalance: number | null;
  usedToday: number;
  usedTotal: number;
}

export function CreditHistoryDrawer({ open, onOpenChange, currentBalance, usedToday, usedTotal }: CreditHistoryDrawerProps) {
  const [items, setItems] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "charges" | "refunds">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // 0-11
  const monthBarRef = useRef<HTMLDivElement>(null);

  // Load all transactions (up to 200) once drawer opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getCreditHistory({ page: 1, limit: 200 })
      .then((res) => setItems(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Available months derived from data
  const availableMonths = useMemo(() => {
    const set = new Set<number>();
    items.forEach((tx) => set.add(new Date(tx.createdAt).getMonth()));
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  // Default to current month when data loads
  useEffect(() => {
    if (items.length && selectedMonth === null) {
      setSelectedMonth(new Date().getMonth());
    }
  }, [items, selectedMonth]);

  // Filter + sort items
  const filtered = useMemo(() => {
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
  }, [items, filter, selectedMonth]);

  // Group by day
  const grouped = useMemo(() => {
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
  }, [filtered]);

  const total = currentBalance ?? 0;
  const budget = total + usedTotal;
  const spentPct = budget > 0 ? Math.round((usedTotal / budget) * 100) : 0;

  const chargesCount = items.filter((t) => t.amount < 0).length;
  const refundsCount = items.filter((t) => t.amount > 0).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[480px] flex flex-col p-0 overflow-hidden">

        {/* ── Compact Header ── */}
        <div className="shrink-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 px-5 pt-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2 text-white text-sm font-bold">
                <Coins className="size-4" />
                Credit History
              </SheetTitle>
            </SheetHeader>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Gauge + Stats row */}
          <div className="flex items-center gap-4">
            {/* Compact circular gauge */}
            <div className="relative shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${0.75 * 2 * Math.PI * 36}`}
                  strokeDashoffset="0"
                  transform="rotate(135 44 44)"
                />
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke="white"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${0.75 * 2 * Math.PI * 36}`}
                  strokeDashoffset={`${0.75 * 2 * Math.PI * 36 * (1 - spentPct / 100)}`}
                  transform="rotate(135 44 44)"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[18px] font-extrabold text-white tabular-nums">{spentPct}%</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/50">Total</p>
                <p className="text-sm font-extrabold text-white tabular-nums leading-tight">{budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/50">Spent</p>
                <p className="text-sm font-extrabold text-white/90 tabular-nums leading-tight">{usedTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/50">Balance</p>
                <p className="text-sm font-extrabold text-white tabular-nums leading-tight">{total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/50">Today</p>
                <p className="text-sm font-extrabold text-white/90 tabular-nums leading-tight">−{usedToday.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="shrink-0 px-4 pt-3 pb-1.5">
          <div className="flex gap-1.5">
            {([
              { key: "all",     label: "All",     icon: Layers,       count: items.length },
              { key: "charges", label: "Charges", icon: TrendingDown, count: chargesCount },
              { key: "refunds", label: "Refunds", icon: TrendingUp,   count: refundsCount },
            ] as const).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  filter === key
                    ? key === "charges"
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                      : key === "refunds"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Icon className="size-3" />
                {label}
                <span className={`text-[9px] rounded-full px-1 ${filter === key ? "bg-white/20" : "bg-slate-100 text-slate-400"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Month Tabs ── */}
        {availableMonths.length > 1 && (
          <div ref={monthBarRef} className="shrink-0 px-4 pb-2 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 min-w-max">
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                className={`h-7 px-3 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                  selectedMonth === null ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                All
              </button>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  className={`h-7 px-3 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                    selectedMonth === m ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200"
                  }`}
                >
                  {MONTHS[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Transaction List ── */}
        <div className="flex-1 overflow-y-auto px-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="size-5 animate-spin text-slate-300" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Coins className="size-8 text-amber-200" />
              <p className="text-xs text-slate-400">No transactions found</p>
            </div>
          ) : (
            <div>
              {grouped.map((group, gi) => (
                <div key={group.label}>
                  {/* Day header */}
                  <div className={`flex items-center gap-2 ${gi > 0 ? "mt-5 pt-4 border-t border-slate-100" : "pt-3"} mb-1`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.label}</span>
                    <span className="text-[9px] text-slate-300 font-medium">
                      {new Date(group.txs[0].createdAt).getFullYear()}
                    </span>
                  </div>
                  {/* Rows */}
                  {group.txs.map((tx, ti) => (
                    <div key={tx.id}>
                      {ti > 0 && <div className="ml-[4.25rem] h-px bg-slate-100" />}
                      <TxRow tx={tx} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
