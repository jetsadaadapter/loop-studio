type ToolbarOption<TKey extends string> = {
  key: TKey;
  label: string;
};

type StoreFilterToolbarProps<
  TTabKey extends string,
  TFilterKey extends string,
> = {
  tabs: Array<ToolbarOption<TTabKey>>;
  selectedTab: TTabKey;
  onTabChange: (key: TTabKey) => void;
  filters: Array<ToolbarOption<TFilterKey>>;
  selectedFilter: TFilterKey;
  filterCounts: Record<TFilterKey, number>;
  onFilterChange: (key: TFilterKey) => void;
};

export function StoreFilterToolbar<
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
}: StoreFilterToolbarProps<TTabKey, TFilterKey>) {
  return (
    <section className="border-b border-slate-200 pb-3">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selectedTab === tab.key
                ? "bg-brand/10 text-brand"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onFilterChange(filter.key)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              selectedFilter === filter.key
                ? "border-brand/30 bg-brand/10 text-brand"
                : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {filter.label} ({filterCounts[filter.key]})
          </button>
        ))}
      </div>
    </section>
  );
}
