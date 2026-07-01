"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coins, X, RefreshCw, Download,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCreditHistory } from "@/core/services/users.service";
import type { CreditTransaction } from "@/core/services/users.service";
import {
  MONTHS,
  FILTER_TABS,
  getAvailableMonths,
  filterAndSortTransactions,
  groupTransactionsByDay,
  getHeaderStyles,
} from "./utils";
import { TxRow } from "./tx-row";
import { exportTransactions } from "./export-utils";

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
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // default to "All" months
  const monthBarRef = useRef<HTMLDivElement>(null);

  // Load all transactions (up to 200) once drawer opens
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setLoading(true);
      getCreditHistory({ page: 1, limit: 200 })
        .then((res) => setItems(res.data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  // Available months derived from data
  const availableMonths = useMemo(() => getAvailableMonths(items), [items]);

  // Filter + sort items
  const filtered = useMemo(() => filterAndSortTransactions(items, filter, selectedMonth), [items, filter, selectedMonth]);

  // Group by day
  const grouped = useMemo(() => groupTransactionsByDay(filtered), [filtered]);

  const handleExportXLSX = () => {
    exportTransactions(filtered, "xlsx");
  };

  const handleExportCSV = () => {
    exportTransactions(filtered, "csv");
  };

  const { total, budget, spentPct, headerBgClass, accentColorClass } = getHeaderStyles(currentBalance, usedTotal);

  const chargesCount = items.filter((t) => t.amount < 0).length;
  const refundsCount = items.filter((t) => t.amount > 0).length;
  const tabCounts = {
    all: items.length,
    charges: chargesCount,
    refunds: refundsCount,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[480px] flex flex-col p-0 overflow-hidden">

        {/* ── Compact Header ── */}
        <div className={`shrink-0 px-5 pt-4 pb-5 ${headerBgClass}`}>
          <div className="flex items-center justify-between mb-3">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm font-bold">
                <Coins className={`size-4 ${accentColorClass}`} />
                Credit History
              </SheetTitle>
            </SheetHeader>
            <div className="flex items-center gap-1.5">
              {filtered.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex h-6 items-center gap-1 rounded bg-white/60 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 px-2 text-[10px] font-bold text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/50 transition-colors cursor-pointer"
                      />
                    }
                  >
                    <Download className="size-2.5" />
                    Export
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 z-50">
                    <DropdownMenuItem
                      onClick={handleExportXLSX}
                      className="py-1.5 text-[11px] cursor-pointer"
                    >
                      Export to Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportCSV}
                      className="py-1.5 text-[11px] cursor-pointer"
                    >
                      Export to CSV (.csv)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-6 items-center justify-center rounded-full bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Gauge + Stats row */}
          <div className="flex items-center gap-4">
            {/* Compact circular gauge */}
            <div className="relative shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200/60 dark:text-slate-800"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${0.75 * 2 * Math.PI * 36}`}
                  strokeDashoffset="0"
                  transform="rotate(135 44 44)"
                />
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke="currentColor"
                  className={`${accentColorClass} transition-all duration-700`}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${0.75 * 2 * Math.PI * 36}`}
                  strokeDashoffset={`${0.75 * 2 * Math.PI * 36 * (1 - spentPct / 100)}`}
                  transform="rotate(135 44 44)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-[18px] font-extrabold text-slate-900 dark:text-white tabular-nums">{spentPct}%</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight">{budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Spent</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white/90 tabular-nums leading-tight">{usedTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Balance</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight">{total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Today</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white/90 tabular-nums leading-tight">
                  {usedToday === 0 ? "0" : `−${usedToday.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="shrink-0 px-4 pt-3 pb-1.5">
          <div className="flex gap-1.5">
            {FILTER_TABS.map(({ key, label, icon: Icon }) => (
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
                  {tabCounts[key]}
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
