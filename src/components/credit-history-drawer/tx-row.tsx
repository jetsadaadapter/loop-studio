import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { CreditTransaction } from "@/core/services/users.service";
import { TYPE_CONFIG, FALLBACK_CFG, fmtTime } from "./utils";

export function TxRow({ tx }: { tx: CreditTransaction }) {
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
