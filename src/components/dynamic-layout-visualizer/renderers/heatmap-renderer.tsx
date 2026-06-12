"use client";

import { cn } from "@/lib/utils";
import { DynamicUISection } from "../types";

interface HeatmapCell {
  x_label?: string;
  y_label?: string;
  row_label?: string;
  col_label?: string;
  category?: string;
  sentiment?: string;
  value?: number;
  count?: number;
}

export function HeatmapRenderer({ section }: { section: DynamicUISection }) {
  const data = section.data as HeatmapCell[] | undefined;
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    // Blueprint mode - show grid intersection schema
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          แกนตารางเปรียบเทียบไขว้ (Cross Matrix Configuration)
        </p>
        <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 select-none">แกนตั้ง (Y-Axis)</span>
            <span className="text-slate-400 font-medium">→</span>
            <span className="text-slate-500 font-bold">ประเภทเจตนาหลัก (เช่น ซื้อสินค้า, สอบถามราคา, โปรโมชั่น)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 select-none">แกนนอน (X-Axis)</span>
            <span className="text-slate-400 font-medium">→</span>
            <span className="text-slate-500 font-bold">ความรู้สึกจำแนก (สนใจอยากซื้อ, ลังเล/ทั่วไป, ไม่สนใจ/แง่ลบ)</span>
          </div>
        </div>
      </div>
    );
  }

  // Active data mode - render color grid
  const getCellLabelX = (c: HeatmapCell) => String(c.col_label || c.x_label || c.sentiment || "");
  const getCellLabelY = (c: HeatmapCell) => String(c.row_label || c.y_label || c.category || "");
  const getCellValue = (c: HeatmapCell) => Number(c.value !== undefined ? c.value : c.count || 0);

  const colLabels = Array.from(new Set(data.map(getCellLabelX).filter(Boolean)));
  const rowLabels = Array.from(new Set(data.map(getCellLabelY).filter(Boolean)));

  const maxVal = Math.max(...data.map(getCellValue), 1);

  return (
    <div className="space-y-4 select-none">
      <div
        className="grid gap-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider"
        style={{ gridTemplateColumns: `repeat(${colLabels.length}, minmax(0, 1fr))` }}
      >
        {colLabels.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>
      <div className="space-y-2">
        {rowLabels.map((row) => {
          return (
            <div key={row} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block">{row}</span>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${colLabels.length}, minmax(0, 1fr))` }}
              >
                {colLabels.map((col) => {
                  const cell = data.find((c) => getCellLabelY(c) === row && getCellLabelX(c) === col) || {};
                  const val = getCellValue(cell);
                  const intensity = Math.round((val / maxVal) * 100);

                  return (
                    <div
                      key={col}
                      className={cn(
                        "p-3 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all duration-200",
                        intensity > 70 && "bg-brand/10 border-brand/20 text-brand",
                        intensity > 45 && intensity <= 70 && "bg-brand/5 border-brand/10 text-brand/80",
                        intensity <= 45 && "bg-slate-50 border-slate-100 text-slate-500"
                      )}
                      title={`${row} x ${col}`}
                    >
                      <span className="text-xs font-extrabold tabular-nums">{val} รายการ</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
