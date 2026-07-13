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

export function ManageFilterSelect({ label, value, options, onChange, width = "w-full sm:w-36 md:w-40", placeholder = "Select" }: ManageFilterSelectProps) {
  // Convention across every ManagerToolbar filter: the first option is the
  // "no filter" default (e.g. "all"). Highlight the trigger once the user has
  // actually narrowed the list, so active filters are visible at a glance.
  const isActive = options.length > 0 && value !== options[0]?.value;

  return (
    <div className={`shrink-0 ${width}`}>
      {/* items lets <Select.Value> resolve the selected item's label from
          `options` directly, instead of falling back to the raw value once
          SelectContent's items unmount after the popup closes. The `label`
          prop is kept as an aria-label (screen readers only) — the option
          text itself ("All Frameworks", "All Statuses", ...) already names
          the category, so a separate visible label chip was redundant. */}
      <Select items={options} value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger
          aria-label={label}
          className={`h-8 w-full flex items-center justify-between gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer ${
            isActive
              ? "border-brand/30 bg-brand/5 text-brand shadow-3xs"
              : "border-slate-200 bg-white text-slate-700 shadow-3xs hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-xl ring-0">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="rounded-lg text-xs text-slate-700 data-selected:bg-brand/10 data-selected:font-semibold data-selected:text-brand hover:!bg-brand hover:!text-white data-highlighted:!bg-brand data-highlighted:!text-white [&_svg]:text-current"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
