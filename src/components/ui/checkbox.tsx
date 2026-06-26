"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex size-4 items-center justify-center shrink-0 select-none">
        <input
          type="checkbox"
          className="peer absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          ref={ref}
          {...props}
        />
        <div
          className={cn(
            "flex size-4 items-center justify-center rounded border border-slate-350 bg-white transition-all duration-150",
            "peer-checked:bg-brand peer-checked:border-brand peer-checked:text-white",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-focus-visible:ring-offset-2",
            "peer-disabled:opacity-50 peer-disabled:bg-slate-100 peer-disabled:border-slate-200",
            "peer-checked:[&_svg]:opacity-100 peer-checked:[&_svg]:scale-100",
            className
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-2.5 stroke-[3.5] opacity-0 scale-75 transition-all duration-150 text-white"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
