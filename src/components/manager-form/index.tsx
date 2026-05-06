"use client";

import type { ManagerFormProps } from "./types";

export function ManagerForm({
  title,
  description,
  onSubmit,
  actions,
  children,
}: ManagerFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white"
    >
      <header className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </header>

      <div className="space-y-4 p-4">{children}</div>

      <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
        {actions}
      </footer>
    </form>
  );
}
