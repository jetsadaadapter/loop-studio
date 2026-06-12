"use client";

import { DynamicUISection } from "../types";

export function TableRenderer({ section }: { section: DynamicUISection }) {
  const data = section.data as Record<string, unknown>[] | undefined;
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    // Blueprint mode - show columns schema mapping
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          โครงสร้างตารางข้อมูล (Grid Schema)
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-150 border-dashed bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 select-none">
                <th className="p-3 font-extrabold text-slate-450 uppercase text-[10px]">ชื่อคอลัมน์ (Column)</th>
                <th className="p-3 font-extrabold text-slate-455 uppercase text-[10px]">ประเภทข้อมูล (Type)</th>
                <th className="p-3 font-extrabold text-slate-455 uppercase text-[10px]">คำอธิบายพารามิเตอร์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="p-3 font-bold text-slate-700">Comment Text</td>
                <td className="p-3 text-slate-450"><code>String</code></td>
                <td className="p-3 text-slate-500">ข้อความความคิดเห็นดั้งเดิมที่นำมาคัดกรอง</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700">Matched Signals</td>
                <td className="p-3 text-slate-450"><code>String[]</code></td>
                <td className="p-3 text-slate-500">สัญญาณคีย์เวิร์ดที่จับคู่ได้</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700">Sentiment Score</td>
                <td className="p-3 text-slate-450"><code>Enum [pos, neu, neg]</code></td>
                <td className="p-3 text-slate-500">ระดับความรู้สึกที่ประเมินโดยโมเดล AI</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Active data mode - extract columns dynamically from first row keys
  const firstRow = data[0] || {};
  const columns = Object.keys(firstRow).filter(
    (key) => !key.startsWith("_") && key !== "id" && key !== "section_id"
  );

  const formatHeader = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderValue = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 select-none">
            {columns.map((col) => (
              <th key={col} className="px-2.5 py-2 font-extrabold text-slate-455 uppercase text-[9px]">
                {formatHeader(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/40 transition-colors">
              {columns.map((col) => (
                <td key={col} className="px-2.5 py-2 text-slate-700 leading-relaxed max-w-xs truncate select-text text-xs">
                  {renderValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
