import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import type { ManagerFilter } from "./types";

type ManagerToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ManagerFilter[];
  trailing?: ReactNode;
};

export function ManagerToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filters = [],
  trailing,
}: ManagerToolbarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full lg:max-w-sm"
        />

        {filters.map((filter) => (
          <label key={filter.key} className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">{filter.label}</span>
            <select
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              className="h-8 rounded-sm border border-slate-300 px-2 text-sm"
            >
              {filter.options.map((option) => (
                <option
                  key={`${filter.key}:${option.value}`}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}

        {trailing ? <div className="lg:ml-auto">{trailing}</div> : null}
      </div>
    </div>
  );
}
