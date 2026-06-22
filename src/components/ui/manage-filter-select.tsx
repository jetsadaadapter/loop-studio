"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface ManageFilterSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  width?: string;
  placeholder?: string;
}

export function ManageFilterSelect({ label, value, options, onChange, width = "xl:w-40", placeholder = "Select" }: ManageFilterSelectProps) {
  return (
    <div className="flex items-center gap-2 flex-1 xl:flex-initial">
      <span className="text-xs font-semibold text-slate-500 shrink-0">{label}</span>
      <div className={`flex-1 ${width}`}>
        <Select value={value} onValueChange={(v) => v && onChange(v)}>
          <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
