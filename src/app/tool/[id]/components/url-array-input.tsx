"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { List, FileText, Sparkles, Link2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlArrayInputProps {
  id: string;
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string | null;
  hasError?: boolean;
}

export function UrlArrayInput({
  id,
  value,
  onChange,
  placeholder,
  hasError,
}: UrlArrayInputProps) {
  const [isBulk, setIsBulk] = useState(false);
  const [bulkValue, setBulkValue] = useState(value.join("\n"));

  const handleAdd = () => onChange([...value, ""]);
  const handleRemove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));
  const handleItemChange = (index: number, val: string) => {
    const next = [...value];
    next[index] = val;
    onChange(next);
  };
  const handleBulkSave = () => {
    onChange(
      bulkValue
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
    setIsBulk(false);
  };
  const handleBulkCancel = () => {
    setBulkValue(value.join("\n"));
    setIsBulk(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="px-2 py-0.5 bg-slate-100 border border-slate-200/50 text-[9px] font-bold text-slate-500 rounded-md uppercase tracking-wider select-none shrink-0">
          {value.length} items added
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-brand hover:bg-brand/5 border border-slate-200 shadow-xs bg-white transition-colors duration-200 cursor-pointer"
          onClick={() =>
            isBulk
              ? handleBulkCancel()
              : (setBulkValue(value.join("\n")), setIsBulk(true))
          }
        >
          {isBulk ? (
            <>
              <List className="mr-1.5 size-3.5 text-slate-500" /> List View
            </>
          ) : (
            <>
              <FileText className="mr-1.5 size-3.5 text-slate-500" /> Bulk Edit
            </>
          )}
        </Button>
      </div>
      {isBulk ? (
        <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 shadow-xs">
          <Textarea
            value={bulkValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setBulkValue(e.target.value)
            }
            placeholder="Paste your URLs here (one per line or comma-separated)..."
            className={cn(
              "min-h-40 bg-white border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-xl resize-y px-4 py-3 shadow-inner shadow-slate-50",
              hasError && "border-red-500 focus:ring-red-500/20 bg-red-50/30",
            )}
          />

          {/* Premium inline technical formatting advisor */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-brand/5 border border-brand/10 rounded-xl text-[10px] text-slate-600 font-bold select-none">
            <Sparkles className="size-3.5 text-brand shrink-0 animate-pulse" />
            <span>
              Format: Paste one Facebook URL link per line, or separate links
              with commas.
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-9 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs px-5 shadow-sm shadow-brand/10 font-semibold transition-colors duration-200 cursor-pointer"
              onClick={handleBulkSave}
            >
              Apply Changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-xl text-xs px-5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-xs transition-colors duration-200 cursor-pointer"
              onClick={handleBulkCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : value.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200 shadow-xs relative overflow-hidden select-none group min-h-35 transition-all duration-300 hover:border-brand/40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand/5 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all duration-300 relative z-10 shrink-0 mb-3">
            <Link2 className="size-5 transition-transform duration-500 group-hover:rotate-45" />
          </div>

          <h5 className="text-xs font-bold text-slate-700 relative z-10 leading-normal">
            No Source URLs Added
          </h5>
          <p className="text-[10px] text-slate-400/90 font-medium max-w-70 mt-1 relative z-10 leading-normal">
            Add a direct Facebook post URL or switch to Bulk Edit to paste
            multiple links.
          </p>

          <div className="mt-4 flex gap-2 w-full max-w-70 relative z-10 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 rounded-xl border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-none cursor-pointer"
              onClick={handleAdd}
            >
              <Plus className="mr-1 size-3.5" /> Add URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 rounded-xl border-brand/20 bg-brand/5 text-[11px] font-semibold text-brand hover:bg-brand/10 hover:border-brand/30 transition-colors shadow-none cursor-pointer"
              onClick={() => {
                setBulkValue(value.join("\n"));
                setIsBulk(true);
              }}
            >
              <FileText className="mr-1 size-3.5" /> Bulk Paste
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div
              key={`url-input-${id}-${index}`}
              className="flex gap-2 items-center group/row"
            >
              {/* Visual index bubble that glows with brand on hover */}
              <div className="flex items-center justify-center size-8 bg-slate-100/80 text-slate-500 text-[10.5px] font-bold rounded-lg shrink-0 select-none group-hover/row:bg-brand/10 group-hover/row:text-brand transition-all duration-300">
                {index + 1}
              </div>

              {/* Inner absolute trash containment */}
              <div className="flex-1 relative flex items-center min-w-0">
                <Input
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={placeholder || "https://..."}
                  className={cn(
                    "h-10 pr-10 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-xl",
                    hasError &&
                      "border-red-500 focus:ring-red-500/20 bg-red-50/30",
                  )}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 size-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/row:opacity-100 focus:opacity-100 cursor-pointer"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 rounded-xl border-dashed border-slate-200/80 bg-slate-50/20 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 transition-colors duration-200 shadow-none font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            onClick={handleAdd}
          >
            <Plus className="size-4 shrink-0" /> Add Another URL
          </Button>
        </div>
      )}
    </div>
  );
}
