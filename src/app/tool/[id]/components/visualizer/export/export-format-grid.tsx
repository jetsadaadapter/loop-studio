"use client";

import type { ExportFormat } from "./export-utils";

interface ExportFormatGridProps {
  format: ExportFormat;
  onChange: (format: ExportFormat) => void;
}

export function ExportFormatGrid({ format, onChange }: ExportFormatGridProps) {
  const formats: ExportFormat[] = ["json", "csv", "xml", "excel", "html", "rss", "jsonl"];

  return (
    <div>
      <label className="block text-slate-800 font-bold text-xs uppercase tracking-wide mb-2.5">
        Format
      </label>
      <div className="grid grid-cols-4 gap-2">
        {formats.map((fmt) => (
          <label
            key={fmt}
            className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition-all ${
              format === fmt
                ? "border-brand bg-brand/5 text-brand ring-1 ring-brand/10 font-bold"
                : "bg-white text-slate-650"
            }`}
          >
            <span className="font-bold uppercase tracking-wider text-[11px]">
              {fmt === "html" ? "HTML Table" : fmt}
            </span>
            <input
              type="radio"
              name="format"
              checked={format === fmt}
              onChange={() => onChange(fmt)}
              className="sr-only"
            />
            <div
              className={`size-3.5 rounded-full border flex items-center justify-center ${
                format === fmt ? "border-brand bg-brand" : "border-slate-300 bg-white"
              }`}
            >
              {format === fmt && <div className="size-1.5 rounded-full bg-white" />}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
