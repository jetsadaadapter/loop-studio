"use client";

import { useEffect, useState } from "react";
import { Coins, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getUserCredits, getCreditHistory } from "@/core/services/users.service";
import type { CreditBalance, CreditTransaction } from "@/core/services/users.service";
import {
  LIMIT,
  BalanceHero,
  CreditsSkeleton,
  CreditsEmptyState,
  TransactionRow,
} from "./user-credits-parts";

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface UserCreditsPanelProps {
  onTopUp?: () => void;
}

export function UserCreditsPanel({ onTopUp }: UserCreditsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const todayUsage = history
    .filter((tx) => {
      const d = new Date(tx.createdAt);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate() &&
        tx.amount < 0
      );
    })
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  async function load(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [bal, hist] = await Promise.all([
        getUserCredits(),
        getCreditHistory({ page, limit: LIMIT }),
      ]);
      setBalance(bal);
      setHistory(hist.data ?? []);
      setTotal(hist.total ?? 0);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isOpen) void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, page]);

  function handleToggle() {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && balance === null) void load();
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/60 bg-white shadow-xs overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
            <Coins className="size-3.5" />
          </span>
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-800">My Credits</span>
            {!isOpen && balance !== null && (
              <span className="ml-2 text-xs text-slate-400 font-normal">
                —{" "}
                <span className="font-semibold text-amber-600 tabular-nums">
                  {(balance.credits ?? 0).toLocaleString()}
                </span>{" "}
                available
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); void load(true); }}
              disabled={refreshing}
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Refresh credits"
            >
              <RefreshCw className={`size-3 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}
          {isOpen
            ? <ChevronUp className="size-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            : <ChevronDown className="size-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          }
        </div>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-5">
          {loading ? (
            <CreditsSkeleton />
          ) : (
            <>
              {balance !== null && (
                <BalanceHero balance={balance} todayUsage={todayUsage} onTopUp={onTopUp} />
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="typo-caption text-slate-500">Transaction History</p>
                <span className="text-[10px] text-slate-400 tabular-nums">{total.toLocaleString()} total</span>
              </div>

              {history.length === 0 ? (
                <CreditsEmptyState />
              ) : (
                <div className="space-y-1">
                  {history.map((tx, idx) => (
                    <TransactionRow key={tx.id} tx={tx} isEven={idx % 2 === 0} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-brand disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-[11px] text-slate-400 tabular-nums">{page} / {totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-brand disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
