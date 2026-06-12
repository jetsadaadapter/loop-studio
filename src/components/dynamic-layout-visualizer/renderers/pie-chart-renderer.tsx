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
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2 h-36">
        <div className="relative size-32 animate-pulse bg-slate-100 rounded-full flex items-center justify-center">
          <div className="size-20 bg-white rounded-full" />
        </div>
        <div className="w-full sm:w-auto min-w-[150px] space-y-2.5">
          <div className="h-4 bg-slate-100 rounded w-28 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  // Harmonious color palette
  const colors = ["#10b981", "#94a3b8", "#f43f5e", "#6366f1", "#f59e0b"];

  const chartData = data.map((item, index) => {
    const value = Number(item.value) || 0;
    const percent = total > 0 ? (value / total) * 100 : 0;
    return {
      name: item.label,
      value,
      percent,
      color: colors[index % colors.length] || colors[0],
      bgClass:
        [
          "bg-emerald-500",
          "bg-slate-400",
          "bg-rose-500",
          "bg-indigo-500",
          "bg-amber-500",
        ][index % 5] || "bg-emerald-500",
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
      {/* Chart Wrapper */}
      <div className="relative size-28 select-none flex items-center justify-center shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={26}
              outerRadius={40}
              paddingAngle={2}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-extrabold text-slate-800 tabular-nums">
            {total}
          </span>
          <span className="text-[8px] font-bold text-slate-400">รวมรายการ</span>
        </div>
      </div>

      {/* Legends list */}
      <div className="space-y-1.5 w-full sm:w-auto min-w-[150px]">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full shrink-0", item.bgClass)} />
              <span className="text-xs font-bold text-slate-600">{item.name}</span>
            </div>
            <span className="text-xs font-extrabold text-slate-800 tabular-nums">
              {item.value} ({item.percent.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
