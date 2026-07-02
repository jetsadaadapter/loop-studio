"use client";

import type { ToolJob } from "@/core/interfaces/tools.interface";
import type { ScrapedJobItem } from "../../../tool-job-utils";

interface SentimentItem {
  id: string;
  sentiment: string;
  confidenceScore: number;
  briefReason: string;
}

interface SentimentAnalysisOverviewProps {
  job: ToolJob;
  items: ScrapedJobItem[];
  paginatedItems: ScrapedJobItem[];
  startIndex: number;
}

const SENTIMENT_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; bar: string; dot: string }
> = {
  positive: {
    label: "Positive",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  neutral: {
    label: "Neutral",
    bg: "bg-amber-50",
    text: "text-amber-700",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  negative: {
    label: "Negative",
    bg: "bg-rose-50",
    text: "text-rose-700",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
  },
};

function toSentimentItem(raw: Record<string, unknown>): SentimentItem {
  const analysis = raw.analysis as Record<string, unknown> | undefined;
  
  const idValue = typeof raw.id === "string" ? raw.id : String(raw.id ?? analysis?.id ?? "");
  const sentimentValue = typeof raw.sentiment === "string" 
    ? raw.sentiment 
    : typeof analysis?.sentiment === "string" 
      ? analysis.sentiment 
      : "";
  const confidenceScoreValue = typeof raw.confidenceScore === "number" 
    ? raw.confidenceScore 
    : typeof analysis?.confidenceScore === "number" 
      ? analysis.confidenceScore 
      : 0;
  const briefReasonValue = typeof raw.briefReason === "string" 
    ? raw.briefReason 
    : typeof analysis?.briefReason === "string" 
      ? analysis.briefReason 
      : "";

  return {
    id: idValue,
    sentiment: sentimentValue,
    confidenceScore: confidenceScoreValue,
    briefReason: briefReasonValue,
  };
}

function getSentimentConfig(sentiment: string) {
  const normalized = (sentiment || "").toLowerCase();
  return (
    SENTIMENT_CONFIG[normalized] ?? {
      label: sentiment,
      bg: "bg-slate-50",
      text: "text-slate-600",
      bar: "bg-slate-400",
      dot: "bg-slate-400",
    }
  );
}

function SentimentSummaryBar({
  items,
  itemCount,
}: {
  items: SentimentItem[];
  itemCount: number;
}) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const s = (item.sentiment || "Unknown").toLowerCase();
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const sentimentOrder = ["positive", "neutral", "negative"];

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight font-sans">
            ผลวิเคราะห์ Sentiment
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
            สรุปผลการวิเคราะห์อารมณ์และความรู้สึกจากข้อมูล
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-bold">
            Total
          </span>
          <span className="text-lg font-bold text-slate-900 font-sans">
            {itemCount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sentimentOrder.map((s) => {
          const count = counts[s] ?? 0;
          const pct = itemCount > 0 ? Math.round((count / itemCount) * 100) : 0;
          const cfg = getSentimentConfig(s);
          return (
            <div
              key={s}
              className={`p-3 rounded-lg border border-slate-100/60 ${cfg.bg} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-[11px] font-bold font-sans ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
                <span className={`text-[10px] font-bold font-sans px-1.5 py-0.5 rounded-full bg-white/70 ${cfg.text}`}>
                  {pct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cfg.bar} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 font-sans ml-2 shrink-0">
                  {count.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SentimentItemCard({
  item,
  index,
}: {
  item: SentimentItem;
  index: number;
}) {
  const cfg = getSentimentConfig(item.sentiment);
  const pct = Math.round(item.confidenceScore * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-3.5 space-y-2.5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
      {/* Header row: sentiment badge + confidence */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${cfg.bg} ${cfg.text}`}
        >
          <span className={`size-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${cfg.bar} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-600 font-sans">
            {pct}%
          </span>
        </div>
      </div>

      {/* Brief reason */}
      <p className="text-[11.5px] text-slate-700 leading-relaxed font-sans line-clamp-3">
        {item.briefReason || <span className="text-slate-400 italic">ไม่มีเหตุผล</span>}
      </p>

      {/* ID footer */}
      <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
          #{index + 1}
        </span>
        <span className="text-[9px] text-slate-400 font-sans truncate">
          {item.id}
        </span>
      </div>
    </div>
  );
}

export function SentimentAnalysisOverview({
  job,
  items,
  paginatedItems,
  startIndex,
}: SentimentAnalysisOverviewProps) {
  const itemCount =
    (job.result as Record<string, unknown> | undefined)?.itemCount as number ??
    items.length;

  const allItems = items.map((i) => toSentimentItem(i as Record<string, unknown>));
  const pageItems = paginatedItems.map((i) =>
    toSentimentItem(i as Record<string, unknown>)
  );

  return (
    <div className="bg-slate-50/60 p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-4">
        <SentimentSummaryBar items={allItems} itemCount={itemCount} />

        {/* Items list header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
            รายการ ({startIndex + 1}–{Math.min(startIndex + pageItems.length, itemCount)} จาก {itemCount.toLocaleString()})
          </h4>
          <p className="text-[10.5px] text-slate-400 font-medium font-sans">
            สลับไปแท็บ All Fields เพื่อดูข้อมูลทั้งหมด
          </p>
        </div>

        {/* Item cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageItems.map((item, idx) => (
            <SentimentItemCard
              key={`sentiment-${item.id || idx}`}
              item={item}
              index={startIndex + idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
