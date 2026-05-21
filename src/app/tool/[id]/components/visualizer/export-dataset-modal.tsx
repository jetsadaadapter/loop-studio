"use client";

import { useState } from "react";
import { X, HelpCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/toast-provider";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { 
  ExportConfig, 
  ExportFormat, 
  getProcessedItems, 
  formatDataset,
  getFileExtension,
  exportMimeTypes
} from "./export-utils";
import { ExportFieldSelector } from "./export-field-selector";
import { ExportFormatGrid } from "./export-format-grid";
import { ExportAdvancedOptions } from "./export-advanced-options";

interface ExportDatasetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ToolJob;
}

export function ExportDatasetModal({ open, onOpenChange, job }: ExportDatasetModalProps) {
  const { pushToast } = useToast();
  
  const [config, setConfig] = useState<ExportConfig>({
    view: "overview",
    format: "json",
    selectedFields: [],
    omittedFields: [],
    limit: "",
    offset: "",
    xmlRoot: "results",
    csvDelimiter: ",",
  });

  const items = job.result?.items || [];
  const runId = job.jobId || job._id;

  const allKeys = Array.from(
    new Set(items.flatMap((item: any) => Object.keys(item)))
  ).filter((k) => k !== "analysis");



  const handleDownload = async () => {
    try {
      const processed = getProcessedItems(items, config);

      if (config.format === "excel") {
        const XLSX = await import("xlsx");
        const worksheet = XLSX.utils.json_to_sheet(processed);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dataset");
        const rawBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([rawBuffer], { 
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dataset_${runId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        pushToast("Dataset download started successfully!", "success");
        return;
      }

      const processed2 = getProcessedItems(items, config);
      const content = formatDataset(processed2, config.format, {
        xmlRoot: config.xmlRoot,
        csvDelimiter: config.csvDelimiter,
        runId,
      });
      const blob = new Blob([content], { type: exportMimeTypes[config.format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dataset_${runId}.${getFileExtension(config.format)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      pushToast("Dataset download started successfully!", "success");
    } catch {
      pushToast("Failed to download dataset.", "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] bg-white border border-slate-200 shadow-2xl rounded-xl p-0 overflow-hidden flex flex-col text-slate-805 focus:outline-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
            <span>Export dataset</span>
            <span title="Configure and download output dataset">
              <HelpCircle className="size-4 text-slate-400 cursor-help" />
            </span>
          </h3>
          <button onClick={() => onOpenChange(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5.5 overflow-y-auto max-h-[70vh] text-xs font-semibold text-slate-650 select-none">
          
          {/* View Toggle */}
          <div>
            <label className="block text-slate-800 font-bold text-xs uppercase tracking-wide mb-2.5">View</label>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 w-fit">
              <button onClick={() => setConfig(prev => ({ ...prev, view: "overview" }))} className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${config.view === "overview" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"}`}>
                Overview
              </button>
              <button onClick={() => setConfig(prev => ({ ...prev, view: "all" }))} className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${config.view === "all" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"}`}>
                All fields
              </button>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1 leading-normal">
              {config.view === "overview" 
                ? "Overview mode exports high-level summarized fields (Media, URL, Text, Likes, Comments, Shares)." 
                : "All fields mode exports every column generated in this run. Some fields can be customized below."}
            </p>
          </div>

          {/* Formats Grid with correct vertical spacing (space-y-3 inside component) */}
          <ExportFormatGrid 
            format={config.format} 
            onChange={(fmt) => setConfig(prev => ({ ...prev, format: fmt }))} 
          />

          {/* Fields Selection (Only for All fields) */}
          {config.view === "all" && (
            <div className="grid grid-cols-2 gap-4">
              <ExportFieldSelector
                label="Select fields (optional)"
                selected={config.selectedFields}
                onChange={(updated) => setConfig((prev) => ({ ...prev, selectedFields: updated }))}
                allKeys={allKeys}
                placeholder="All fields included"
              />
              <ExportFieldSelector
                label="Omit fields (optional)"
                selected={config.omittedFields}
                onChange={(updated) => setConfig((prev) => ({ ...prev, omittedFields: updated }))}
                allKeys={allKeys}
                placeholder="Select..."
              />
            </div>
          )}

          {/* Expandable Advanced Options */}
          <ExportAdvancedOptions 
            config={config} 
            onChange={(updated) => setConfig(updated)} 
          />

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3 select-none">
          <Button onClick={handleDownload} className="h-9.5 bg-brand hover:bg-brand/90 text-white rounded-lg text-xs font-bold px-5 gap-1.5 cursor-pointer shadow-sm">
            <Download className="size-3.5" />
            <span>Download</span>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
