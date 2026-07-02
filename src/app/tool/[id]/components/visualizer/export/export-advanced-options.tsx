"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { ExportConfig } from "./export-utils";

interface ExportAdvancedOptionsProps {
  config: ExportConfig;
  onChange: (config: ExportConfig) => void;
}

export function ExportAdvancedOptions({ config, onChange }: ExportAdvancedOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50/50 hover:bg-slate-50 px-4 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer transition-colors"
        aria-expanded={isOpen ? "true" : "false"}
        aria-label="Toggle advanced export options"
      >
        <span className="flex items-center gap-1.5">
          Advanced options
          <ChevronRight
            className={`size-4 text-slate-400 transition-transform ${
              isOpen ? "rotate-90 text-slate-750 font-bold" : ""
            }`}
          />
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-slate-150 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 text-[11px] font-bold mb-2">Limit items</label>
            <input
              type="number"
              placeholder="All"
              value={config.limit}
              onChange={(e) => onChange({ ...config, limit: e.target.value })}
              className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-brand font-semibold text-slate-750"
            />
          </div>
          <div>
            <label className="block text-slate-700 text-[11px] font-bold mb-2">Offset items</label>
            <input
              type="number"
              placeholder="0"
              value={config.offset}
              onChange={(e) => onChange({ ...config, offset: e.target.value })}
              className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-brand font-semibold text-slate-750"
            />
          </div>
          {config.format === "xml" && (
            <div className="col-span-2">
              <label className="block text-slate-700 text-[11px] font-bold mb-2">XML Root Tag</label>
              <input
                type="text"
                value={config.xmlRoot}
                onChange={(e) => onChange({ ...config, xmlRoot: e.target.value })}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-brand font-semibold text-slate-750"
              />
            </div>
          )}
          {config.format === "csv" && (
            <div className="col-span-2">
              <label className="block text-slate-700 text-[11px] font-bold mb-2">CSV Delimiter</label>
              <input
                type="text"
                value={config.csvDelimiter}
                onChange={(e) => onChange({ ...config, csvDelimiter: e.target.value })}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-brand font-semibold text-slate-750"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
