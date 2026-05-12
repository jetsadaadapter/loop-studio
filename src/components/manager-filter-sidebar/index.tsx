import type { ReactNode } from "react";
import {
  BadgeCheck,
  BookText,
  ClipboardList,
  PlugZap,
  Smile,
  Tag,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type FilterOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type FilterSection = {
  key: string;
  title: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

type ManagerFilterSidebarProps = {
  sections: FilterSection[];
  onReset: () => void;
  resetDisabled?: boolean;
  resetLabel?: string;
};

function resolveCategoryIcon(label: string): ReactNode {
  const normalized = label.trim().toLowerCase();

  if (normalized === "all")
    return <ClipboardList className="size-4" aria-hidden />;
  if (normalized === "fashion")
    return <BadgeCheck className="size-4" aria-hidden />;
  if (normalized === "books")
    return <BookText className="size-4" aria-hidden />;
  if (normalized === "toys") return <Smile className="size-4" aria-hidden />;
  if (normalized === "electronics")
    return <PlugZap className="size-4" aria-hidden />;

  return <Tag className="size-4" aria-hidden />;
}

export function ManagerFilterSidebar({
  sections,
  onReset,
  resetDisabled = false,
  resetLabel = "Reset Filter",
}: ManagerFilterSidebarProps) {
  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <div key={section.key} className="space-y-3">
          {sectionIndex > 0 ? <Separator className="mb-6" /> : null}
          <h3 className="px-1 text-sm font-semibold text-foreground">
            {section.title}
          </h3>
          <ul className="my-4 mt-0 flex flex-col gap-1 pt-2">
            {section.options.map((option) => {
              const isActive = section.value === option.value;
              const icon =
                option.icon ??
                (section.key === "category"
                  ? resolveCategoryIcon(option.label)
                  : null);

              return (
                <li key={`${section.key}:${option.value}`} className="mx-2">
                  <button
                    type="button"
                    onClick={() => section.onChange(option.value)}
                    className={`flex w-full items-center gap-2 rounded-md px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? "bg-primary/5 font-medium text-primary"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {icon}
                    <span>{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <Button
        type="button"
        variant="default"
        size="lg"
        className="w-full rounded-md"
        onClick={onReset}
        disabled={resetDisabled}
      >
        {resetLabel}
      </Button>
    </div>
  );
}
