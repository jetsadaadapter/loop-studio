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

  const getHeatmapCellStyle = (colName: string, intensity: number, val: number) => {
    if (val === 0) {
      return { className: "bg-slate-50/50 border-slate-100/50 text-slate-350" };
    }

    const l = colName.toLowerCase();
    const isNeu = l.includes("ไม่สนใจ") || l.includes("neu") || l.includes("ทั่วไป") || l.includes("ไม่ซื้อ") || l.includes("indifferent");
    const isNeg = l.includes("แง่ลบ") || l.includes("neg") || l.includes("negative") || l.includes("ลบ") || l.includes("แย่");
    const isPos = !isNeu && !isNeg && (l.includes("อยากซื้อ") || l.includes("สนใจ") || l.includes("pos") || l.includes("positive") || l.includes("ซื้อ") || l.includes("อยากได้"));

    if (isNeu) {
      if (intensity > 70) {
        return { className: "bg-slate-400 border-slate-500 text-white shadow-3xs" };
      }
      if (intensity > 35) {
        return { className: "bg-slate-200 border-slate-300/80 text-slate-700 hover:bg-slate-300" };
      }
      return { className: "bg-slate-100/70 border-slate-200/80 text-slate-500 hover:bg-slate-200/50" };
    }

    if (isNeg) {
      if (intensity > 70) {
        return { className: "bg-rose-500 border-rose-600 text-white shadow-3xs" };
      }
      if (intensity > 35) {
        return { className: "bg-rose-100 border-rose-200 text-rose-700 hover:bg-rose-200/80" };
      }
      return { className: "bg-rose-50/70 border-rose-100/80 text-rose-600 hover:bg-rose-100/50" };
    }

    if (isPos) {
      if (intensity > 70) {
        return { className: "bg-emerald-500 border-emerald-600 text-white shadow-3xs" };
      }
      if (intensity > 35) {
        return { className: "bg-emerald-100 border-emerald-200 text-emerald-700 hover:bg-emerald-200/80" };
      }
      return { className: "bg-emerald-50/70 border-emerald-100/80 text-emerald-600 hover:bg-emerald-100/50" };
    }

    // Fallback: brand/indigo
    if (intensity > 70) {
      return { className: "bg-brand border-brand/90 text-white shadow-3xs" };
    }
    if (intensity > 35) {
      return { className: "bg-brand/15 border-brand/25 text-brand" };
    }
    return { className: "bg-brand/5 border-brand/10 text-brand/80" };
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white shadow-3xs">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="bg-slate-50/75 border-b border-slate-200/60 select-none">
            <th className="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider text-[9.5px] border-r border-slate-150/60">
              วิเคราะห์เมทริกซ์ไขว้
            </th>
            {colLabels.map((col) => (
              <th key={col} className="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider text-[9.5px] text-center">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {rowLabels.map((row) => (
            <tr key={row} className="hover:bg-slate-50/20 transition-colors">
              <td className="p-3.5 font-bold text-slate-700 border-r border-slate-150/60 max-w-[150px] truncate select-text">
                {row}
              </td>
              {colLabels.map((col) => {
                const cell = data.find((c) => getCellLabelY(c) === row && getCellLabelX(c) === col) || {};
                const val = getCellValue(cell);
                const intensity = Math.round((val / maxVal) * 100);
                const style = getHeatmapCellStyle(col, intensity, val);

                return (
                  <td key={col} className="p-2 text-center select-none min-w-[100px]">
                    <div
                      className={cn(
                        "py-3.5 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 border font-semibold transition-all duration-200 hover:scale-[1.02]",
                        style.className
                      )}
                      title={`${row} - ${col}: ${val} รายการ`}
                    >
                      <span className="text-[11px] font-extrabold tabular-nums leading-none">
                        {val}
                      </span>
                      <span className="text-[7.5px] font-bold opacity-80 uppercase tracking-wider leading-none mt-0.5">
                        รายการ
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
