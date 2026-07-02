"use client";

import { Info } from "lucide-react";
import { DynamicUISection } from "../types";

interface ScorecardData {
  label: string;
  value: string | number;
}

export function ScorecardRenderer({ section }: { section: DynamicUISection }) {
  const data = section.data as ScorecardData[] | undefined;
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    // Blueprint mode - show tracked KPIs template
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          ตัวชี้วัดหลักที่กำหนด (Tracked KPIs)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            "ดัชนีเจตนาการซื้อโดยตรง (Intent Score)",
            "ความพึงพอใจต่อแบรนด์ (Sentiment Focus)",
            "ความหนาแน่นของสัญญาณ (Signal Density)"
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 space-y-1 shadow-3xs">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">KPI #{idx + 1}</span>
              <span className="text-xs font-extrabold text-slate-800 tracking-tight">{kpi}</span>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 select-none font-medium">
                <Info className="size-2.5 text-slate-355" />
                <span>คำนวณแบบสถิติ</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
      {data.map((card, idx) => (
        <div 
          key={idx} 
          className="p-3.5 bg-white border border-slate-200/60 rounded-xl shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-1 select-none"
        >
          <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none">
            {card.label}
          </h5>
          <div className="flex items-baseline mt-1.5 justify-between">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none tabular-nums font-sans">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
