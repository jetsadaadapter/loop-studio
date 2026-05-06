import type { ReactNode } from "react";

type ManagerFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ManagerFormSection({
  title,
  description,
  children,
}: ManagerFormSectionProps) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-3">
      <header>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
