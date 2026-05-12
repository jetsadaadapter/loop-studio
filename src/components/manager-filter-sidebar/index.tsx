import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type FilterOption = {
  value: string;
  label: string;
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
          <div className="space-y-1">
            {section.options.map((option) => {
              const isActive = section.value === option.value;

              return (
                <button
                  key={`${section.key}:${option.value}`}
                  type="button"
                  onClick={() => section.onChange(option.value)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onReset}
        disabled={resetDisabled}
      >
        {resetLabel}
      </Button>
    </div>
  );
}
