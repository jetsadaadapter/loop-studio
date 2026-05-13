import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import type { ManagerFilter } from "./types";

type ManagerToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ManagerFilter[];
  trailing?: ReactNode;
  className?: string;
  layout?: "horizontal" | "vertical";
};

export function ManagerToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filters = [],
  trailing,
  className = "",
  layout = "horizontal",
}: ManagerToolbarProps) {
  // Responsive layout: horizontal (default) or vertical
  const isHorizontal = layout === "horizontal";
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 ${className}`}
      style={{ minHeight: 64 }}
    >
      <div
        className={`flex w-full items-center gap-3 ${
          isHorizontal ? "flex-col md:flex-row md:gap-4" : "flex-col gap-3"
        }`}
      >
        <div className="flex w-full max-w-md flex-1 items-center">
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full"
          />
        </div>
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {filters.map((filter) => (
              <label
                key={filter.key}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-slate-600">{filter.label}</span>
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className="h-8 rounded-md border border-slate-300 px-2 text-sm bg-white"
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
          </div>
        )}
        {trailing ? (
          <div className="flex flex-1 justify-end items-center min-w-fit md:ml-auto">
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
