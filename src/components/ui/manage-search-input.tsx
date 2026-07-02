"use client";

import { Search } from "lucide-react";

interface ManageSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ManageSearchInput({ value, onChange, placeholder = "Search…", className = "" }: ManageSearchInputProps) {
  return (
    <div className={`relative w-full xl:w-80 shrink-0 ${className}`}>
      <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-slate-400"
      />
    </div>
  );
}
