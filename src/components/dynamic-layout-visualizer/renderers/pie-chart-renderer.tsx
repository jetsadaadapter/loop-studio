"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicUISection } from "../types";

interface PieChartData {
  label: string;
  value: number;
}

export function PieChartRenderer({ section }: { section: DynamicUISection }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const data = section.data as unknown as PieChartData[] | undefined;
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    // Blueprint mode - show output label mapping
    const labels = section.labels || {
      interested_in_buying: "สนใจซื้อ",
      not_interested: "ไม่สนใจ",
      negative_sentiment: "แง่ลบ",
    };
    const labelEntries = Object.entries(labels);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        <div className="relative size-32 flex items-center justify-center">
          <svg className="size-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="8"
              strokeDasharray="4 4"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            <PieIcon className="size-5 text-slate-350 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400">Pie Breakdown</span>
          </div>
        </div>

        <div className="space-y-3 w-full sm:w-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ตัวแปรผลลัพธ์ (Label Definitions)
          </p>
          <div className="grid grid-cols-1 gap-2">
            {labelEntries.map(([key, val]) => (
              <div
                key={key}
                className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-100 text-xs shadow-3xs"
              >
                <span className="size-2 rounded-full bg-brand/40 shrink-0" />
                <code className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  {key}
                </code>
                <span className="text-slate-400 text-[10px]">→</span>
                <span className="font-extrabold text-slate-700">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active data mode - calculate dynamic values
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  // Custom skeleton to mitigate CLS on mount
  if (!mounted) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 h-52">
        <div className="relative size-40 sm:size-48 animate-pulse bg-slate-100 rounded-full flex items-center justify-center">
          <div className="size-24 bg-white rounded-full" />
        </div>
        <div className="w-full sm:w-auto min-w-[150px] space-y-2.5">
          <div className="h-4 bg-slate-100 rounded w-28 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  // Harmonious and semantic color palette mapping
  const getSemanticColor = (label: string, index: number) => {
    const l = label.toLowerCase();
    
    // Check neutral/negative keywords first to prevent overlap (e.g. "ไม่สนใจ" matches "สนใจ")
    if (l.includes("ไม่สนใจ") || l.includes("neu") || l.includes("ทั่วไป") || l.includes("ไม่ซื้อ") || l.includes("indifferent")) {
      return { hex: "#94a3b8", bg: "bg-slate-400" };
    }
    if (l.includes("แง่ลบ") || l.includes("neg") || l.includes("negative") || l.includes("ลบ") || l.includes("แย่")) {
      return { hex: "#f43f5e", bg: "bg-rose-500" };
    }
    if (l.includes("อยากซื้อ") || l.includes("สนใจ") || l.includes("pos") || l.includes("positive") || l.includes("ซื้อ") || l.includes("อยากได้")) {
      return { hex: "#10b981", bg: "bg-emerald-500" };
    }

    const defaultColors = [
      { hex: "#10b981", bg: "bg-emerald-500" },
      { hex: "#94a3b8", bg: "bg-slate-400" },
      { hex: "#f43f5e", bg: "bg-rose-500" },
      { hex: "#6366f1", bg: "bg-indigo-500" },
      { hex: "#f59e0b", bg: "bg-amber-500" },
    ];
    return defaultColors[index % defaultColors.length];
  };

  const chartData = data.map((item, index) => {
    const value = Number(item.value) || 0;
    const percent = total > 0 ? (value / total) * 100 : 0;
    const semantic = getSemanticColor(item.label, index);
    return {
      name: item.label,
      value,
      percent,
      color: semantic.hex,
      bgClass: semantic.bg,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
      {/* Chart Wrapper */}
      <div className="relative size-40 sm:size-48 select-none flex items-center justify-center shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={64}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataInfo = payload[0].payload as {
                    name: string;
                    value: number;
                    percent: number;
                  };
                  return (
                    <div className="bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-md text-[9px] font-bold text-slate-700">
                      <div>{dataInfo.name}</div>
                      <div className="text-slate-500 font-extrabold text-[10px] mt-0.5">
                        {dataInfo.value} รายการ ({dataInfo.percent.toFixed(0)}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Central Summary overlay */}
        <div className="absolute size-20 sm:size-24 rounded-full bg-slate-50/50 backdrop-blur-3xs border border-slate-100/40 flex flex-col items-center justify-center pointer-events-none shadow-3xs">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none tabular-nums font-sans">
            {total}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-450 uppercase tracking-wider mt-1 leading-none">
            รายการ
          </span>
        </div>
      </div>

      {/* Legends list */}
      <div className="space-y-2.5 w-full sm:w-auto min-w-[200px]">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1 w-full sm:w-56 py-1 border-b border-slate-100/30 last:border-0">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full shrink-0 shadow-xs", item.bgClass)} />
                <span className="font-extrabold text-slate-600">{item.name}</span>
              </div>
              <span className="text-xs font-extrabold text-slate-800 tabular-nums">
                {item.value} <span className="text-[9px] text-slate-400 font-bold">({item.percent.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="w-full bg-slate-100/70 h-1.5 rounded-full overflow-hidden select-none">
              <div 
                className={cn("h-full rounded-full transition-all duration-500 ease-out", item.bgClass)}
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
