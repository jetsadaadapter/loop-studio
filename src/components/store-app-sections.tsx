import { AppTile } from "@/components/app-tile";
import { type StoreSection } from "@/app/store/apps/data";

type StoreAppSectionsProps = {
  sections: StoreSection[];
};

export function StoreAppSections({ sections }: StoreAppSectionsProps) {
  return (
    <section className="mt-8 space-y-6">
      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-3xl border border-slate-200 bg-linear-to-b from-slate-50 to-white px-4 py-5 sm:px-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              {section.title}
            </h2>
            <button
              type="button"
              className="text-xs font-medium text-brand hover:text-brand"
            >
              See more
            </button>
          </div>

          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto pb-1">
            {section.items.map((app) => (
              <div key={app.id} className="snap-start">
                <AppTile app={app} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-slate-700">
            No apps match this filter.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Try switching status or category.
          </p>
        </div>
      )}
    </section>
  );
}
