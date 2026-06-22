"use client";

import { Coins, ArrowDownLeft, ArrowUpRight, TrendingUp, Zap } from "lucide-react";
import type { CreditBalance, CreditTransaction } from "@/core/services/users.service";

// ─── Constants ────────────────────────────────────────────────────────────────

export const LOW_BALANCE_THRESHOLD = 10;
export const LIMIT = 10;

export const TYPE_CONFIG: Record<string, {
  label: string;
  bgCls: string;
  textCls: string;
  borderCls: string;
  accentCls: string;
}> = {
  admin_adjust: { label: "Admin",  bgCls: "bg-amber-50",   textCls: "text-amber-700",   borderCls: "border-amber-200",   accentCls: "bg-amber-400"   },
  charge:       { label: "Charge", bgCls: "bg-rose-50",    textCls: "text-rose-600",    borderCls: "border-rose-200",    accentCls: "bg-rose-400"    },
  topup:        { label: "Top-up", bgCls: "bg-emerald-50", textCls: "text-emerald-700", borderCls: "border-emerald-200", accentCls: "bg-emerald-400" },
  refund:       { label: "Refund", bgCls: "bg-sky-50",     textCls: "text-sky-600",     borderCls: "border-sky-200",     accentCls: "bg-sky-400"     },
  bonus:        { label: "Bonus",  bgCls: "bg-violet-50",  textCls: "text-violet-700",  borderCls: "border-violet-200",  accentCls: "bg-violet-400"  },
};

export function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    label: type,
    bgCls: "bg-slate-50",
    textCls: "text-slate-600",
    borderCls: "border-slate-200",
    accentCls: "bg-slate-400",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function CreditsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/30 p-6 mb-4">
        <div className="h-3 w-28 rounded bg-amber-200/60 mb-4" />
        <div className="h-12 w-36 rounded-xl bg-amber-200/60 mb-3" />
        <div className="flex gap-3 mt-4">
          <div className="h-8 w-24 rounded-xl bg-amber-200/40" />
          <div className="h-8 w-24 rounded-xl bg-amber-200/40" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-3 border-b border-slate-100 last:border-0">
          <div className="size-9 rounded-full bg-slate-200/70 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-200/70" />
            <div className="h-2.5 w-1/2 rounded bg-slate-200/50" />
          </div>
          <div className="h-4 w-14 rounded bg-slate-200/70" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function CreditsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-500 shadow-sm mb-4">
        <Coins className="size-7" />
      </div>
      <p className="text-sm font-semibold text-slate-700 mb-1">No transactions yet</p>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
        Credits charged, topped up, or adjusted will appear here as a running statement.
      </p>
    </div>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: string }) {
  const cfg = getTypeConfig(type);
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.bgCls} ${cfg.textCls} ${cfg.borderCls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Balance Hero ─────────────────────────────────────────────────────────────

interface BalanceHeroProps {
  balance: CreditBalance;
  todayUsage: number;
  onTopUp?: () => void;
}

export function BalanceHero({ balance, todayUsage, onTopUp }: BalanceHeroProps) {
  const credits = balance.credits ?? 0;
  const isLow = credits < LOW_BALANCE_THRESHOLD;

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white p-5 mb-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-6 -right-6 size-32 rounded-full bg-amber-300/20 blur-2xl" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 border border-amber-200/70 text-amber-600">
            <Coins className="size-3.5" />
          </span>
          <p className="typo-caption text-amber-700/80">Available Balance</p>
        </div>
        {isLow && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
            </span>
            Low
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
          {credits.toLocaleString()}
        </span>
        <span className="text-sm font-medium text-slate-400">credits</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-amber-200/50 bg-white/70 px-3 py-1.5 shadow-sm">
          <TrendingUp className="size-3 text-amber-500 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{todayUsage.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">used today</span>
        </div>
        {onTopUp && (
          <button
            type="button"
            onClick={onTopUp}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:bg-emerald-100 transition-all duration-200 cursor-pointer"
          >
            <Zap className="size-3 shrink-0" />
            Top-up
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

export function TransactionRow({ tx, isEven }: { tx: CreditTransaction; isEven: boolean }) {
  const isCredit = tx.amount > 0;
  const cfg = getTypeConfig(tx.type);

  const dateStr = new Date(tx.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm group ${isEven ? "bg-slate-50/60" : "bg-white"}`}
    >
      <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${cfg.accentCls} opacity-60`} />
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${isCredit ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-rose-200 bg-rose-50 text-rose-500"}`}>
        {isCredit ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <TypeBadge type={tx.type} />
          {tx.clientType && (
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">{tx.clientType}</span>
          )}
        </div>
        <p className="truncate text-xs font-medium text-slate-700 leading-snug">{tx.description}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{dateStr}</p>
      </div>
      <span className={`shrink-0 text-sm font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-rose-500"}`}>
        {isCredit ? "+" : ""}
        {tx.amount.toLocaleString()}
      </span>
    </div>
  );
}
