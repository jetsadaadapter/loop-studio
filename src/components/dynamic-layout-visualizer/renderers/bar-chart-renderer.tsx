"use client";

import { DynamicUISection } from "../types";

interface BarChartData {
  label: string;
  value: number;
}

export function BarChartRenderer({ section }: { section: DynamicUISection }) {
  const data = section.data as BarChartData[] | undefined;
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    // Blueprint mode - show keywords comparison config
    const keywords = section.signal_keywords
      ? section.signal_keywords.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 4)
      : ["ตัวเลือก A", "ตัวเลือก B"];

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          แกนวิเคราะห์เชิงปริมาณ (Comparison Metrics)
        </p>
        {keywords.map((kw, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-100">{kw}</span>
              <span className="text-slate-400 font-medium text-[10px] italic">
                Awaiting data points count...
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden border border-slate-100/60 border-dashed">
              <div
                className="h-full bg-brand/35 rounded-full"
                style={{ width: `${100 - idx * 25}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Active data mode - calculate max to scale percentages
  const maxVal = Math.max(...data.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
        ผลลัพธ์การคัดกรองปริมาณสถิติ
      </p>
      {data.map((item, idx) => {
        const value = Number(item.value) || 0;
        const percentage = Math.round((value / maxVal) * 100);

        return (
          <div key={idx} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">{item.label}</span>
              <span className="text-slate-400 font-bold tabular-nums text-[10px]">
                {value} รายการ ({percentage}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
