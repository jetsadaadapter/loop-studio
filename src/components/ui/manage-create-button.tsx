"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

interface ManageCreateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function ManageCreateButton({ onClick, disabled = false, children }: ManageCreateButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Plus className="size-4 shrink-0" />
      {children}
    </button>
  );
}
