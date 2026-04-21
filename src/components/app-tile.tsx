import { statusBadgeClass, type StoreApp } from "@/app/store/apps/data";

export function AppTile({ app }: { app: StoreApp }) {
  const initials = app.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <article className="group w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-brand/40 hover:shadow-sm">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm ${app.iconBg}`}
      >
        {initials}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-1 text-sm font-medium text-slate-900">
          {app.name}
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500">{app.category}</p>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(app.status)}`}
        >
          {app.status}
        </span>
      </div>
    </article>
  );
}
