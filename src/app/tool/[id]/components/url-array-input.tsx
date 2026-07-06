"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { List, FileText, Sparkles, Link2, Plus } from "lucide-react";
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
          {value.filter((item) => item.trim() !== "").length} items added
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 rounded-md text-[11px] font-semibold text-slate-700 hover:text-brand hover:bg-brand/5 border border-slate-200 shadow-xs bg-white transition-colors duration-200 cursor-pointer"
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
        <div className="space-y-3.5 p-4 rounded-md bg-slate-50/50 border border-slate-200/60 shadow-xs">
          <Textarea
            value={bulkValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setBulkValue(e.target.value)
            }
            placeholder="Paste your URLs here (one per line or comma-separated)..."
            className={cn(
              "min-h-40 bg-transparent border-slate-200 focus:border-brand focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent transition-all text-sm rounded-md resize-y px-4 py-3 shadow-inner shadow-slate-50 text-xs placeholder:text-xs resize-none",
              hasError && "border-red-500 focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent bg-transparent",
            )}
          />

          {/* Premium inline technical formatting advisor */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-brand/5 border border-brand/10 rounded-md text-[10px] text-slate-600 font-bold select-none">
            <Sparkles className="size-3.5 text-brand shrink-0 animate-pulse" />
            <span>
              Format: Paste one Facebook URL link per line, or separate links
              with commas.
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-9 rounded-md bg-brand hover:bg-brand/90 text-white text-xs px-5 shadow-sm shadow-brand/10 font-semibold transition-colors duration-200 cursor-pointer"
              onClick={handleBulkSave}
            >
              Apply Changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-md text-xs px-5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-xs transition-colors duration-200 cursor-pointer"
              onClick={handleBulkCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : value.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50/30 rounded-md border border-dashed border-slate-200 shadow-xs relative overflow-hidden select-none group min-h-35 transition-all duration-300 hover:border-brand/40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand/5 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="p-3 bg-white border border-slate-100 rounded-md shadow-xs text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all duration-300 relative z-10 shrink-0 mb-3">
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
              className="h-8.5 px-3 rounded-md border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-none cursor-pointer"
              onClick={handleAdd}
            >
              <Plus className="mr-1 size-3.5" /> Add URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 rounded-md border-brand/20 bg-brand/5 text-[11px] font-semibold text-brand hover:bg-brand/10 hover:border-brand/30 transition-colors shadow-none cursor-pointer"
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
        <div className="space-y-4">
          {/* Quick Add Input bar */}
          <div className="flex gap-2">
            <Input
              id={`quick-add-${id}`}
              placeholder={placeholder || "พิมพ์หรือวางลิงก์โพสต์ (เช่น https://www.facebook.com/...)"}
              className={cn(
                "h-8 bg-transparent border-slate-200/80 focus:border-brand focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent transition-all text-xs md:text-xs placeholder:text-xs font-normal rounded-md px-4 flex-1 shadow-2xs hover:border-slate-300",
                hasError && "border-red-500 focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent bg-transparent"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const val = target.value.trim();
                  if (val) {
                    if (value.length === 1 && value[0] === "") {
                      onChange([val]);
                    } else {
                      onChange([...value.filter((item) => item !== ""), val]);
                    }
                    target.value = "";
                  }
                }
              }}
            />
            <Button
              type="button"
              className="h-8 px-4.5 bg-brand hover:bg-brand/95 active:scale-95 text-white font-bold rounded-md text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
              title="เพิ่มลิงก์"
              aria-label="เพิ่มลิงก์"
              onClick={() => {
                const input = document.getElementById(`quick-add-${id}`) as HTMLInputElement;
                if (input) {
                  const val = input.value.trim();
                  if (val) {
                    if (value.length === 1 && value[0] === "") {
                      onChange([val]);
                    } else {
                      onChange([...value.filter((item) => item !== ""), val]);
                    }
                    input.value = "";
                  }
                }
              }}
            >
              <Plus className="size-3.5 shrink-0" />
              <span>เพิ่ม</span>
            </Button>
          </div>

          {/* URL Tag Cloud (Chips display) */}
          {value.some((item) => item && item.trim() !== "") && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {value.map((item, index) => {
                if (!item || item.trim() === "") return null;
                let domain = "facebook.com";
                let displayUrl = item;
                let isValid = false;
                try {
                  const clean = item.startsWith("http") ? item : `https://${item}`;
                  const parsed = new URL(clean);
                  domain = parsed.hostname.replace("www.", "");
                  // Shorten URL pathname elegantly for a clean look
                  displayUrl = parsed.pathname !== "/" && parsed.pathname.length > 10
                    ? `${domain}${parsed.pathname.slice(0, 15)}...`
                    : domain;
                  isValid = item.includes(".") && item.length > 5;
                } catch {
                  displayUrl = item.length > 25 ? `${item.slice(0, 25)}...` : item;
                }

                return (
                  <div
                    key={`url-chip-${id}-${index}`}
                    className={cn(
                      "flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-[10px] font-bold transition-all duration-200 shadow-2xs hover:shadow-xs select-none",
                      isValid
                        ? "bg-emerald-50/50 text-emerald-700 border-emerald-200 hover:border-emerald-350"
                        : "bg-rose-50/50 text-rose-700 border-rose-200 hover:border-rose-350"
                    )}
                    title={item}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- external favicon service URL not in next.config remotePatterns; domain is dynamic per chip */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                      className="w-3.5 h-3.5 rounded-md shrink-0 bg-white border border-slate-100 shadow-2xs"
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="truncate max-w-48 leading-none pt-0.5 font-bold">
                      {displayUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200/50 hover:bg-slate-350/60 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer select-none font-extrabold text-[8px] leading-none pt-0.5"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
