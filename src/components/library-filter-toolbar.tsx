import { Blocks, Layers, Wrench } from "lucide-react";

type ToolbarOption<TKey extends string> = {
  key: TKey;
  label: string;
};

type LibraryFilterToolbarProps<
  TTabKey extends string,
  TFilterKey extends string,
> = {
  tabs: Array<ToolbarOption<TTabKey>>;
  selectedTab: TTabKey | null;
  onTabChange: (key: TTabKey) => void;
  filters: Array<ToolbarOption<TFilterKey>>;
  selectedFilter: TFilterKey | null;
  filterCounts: Record<TFilterKey, number>;
  onFilterChange: (key: TFilterKey) => void;
};

export function LibraryFilterToolbar<
  TTabKey extends string,
  TFilterKey extends string,
>({
  tabs,
  selectedTab,
  onTabChange,
  filters,
  selectedFilter,
  filterCounts,
  onFilterChange,
}: LibraryFilterToolbarProps<TTabKey, TFilterKey>) {
  const visibleFilters = filters.filter(
    (filter) => filter.key !== "all" && filter.key !== "new",
  );

  const getTabIcon = (tab: ToolbarOption<TTabKey>) => {
    const normalized = `${tab.key} ${tab.label}`.toLowerCase();

    if (normalized.includes("platform")) {
      return Layers;
    }

    if (normalized.includes("tool")) {
      return Wrench;
    }

    return Blocks;
  };

  return (
    <section>
      {tabs.length > 0 ? (
        <div className="flex h-8 items-center gap-2.5 pb-0 mt-4 px-4 xs:px-0">
          {tabs.map((tab) => {
            const Icon = getTabIcon(tab);
            const isActive = selectedTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 max-h-8 text-sm font-semibold transition-all duration-200 ${isActive
                  ? "border-brand bg-brand text-white shadow-[0_10px_20px_-16px_rgba(194,0,25,0.65)]"
                  : "border-slate-300 text-slate-600 hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon
                  className={`size-4 transition-all duration-200 ${isActive
                    ? "text-white"
                    : "text-slate-900 group-hover:scale-105"
                    }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {visibleFilters.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 px-4 xs:px-0">
          {visibleFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange(filter.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all duration-200 ${selectedFilter === filter.key
                ? "border-brand bg-brand text-white"
                : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                }`}
            >
              {filter.label} ({filterCounts[filter.key]})
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
