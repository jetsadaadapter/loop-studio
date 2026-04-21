import { type StoreApp } from "@/app/store/apps/data";
import { AppIcon } from "@/components/app-icon";
import { statusBadgeClass } from "@/lib/utils";

export function AppTile({ app }: { app: StoreApp }) {
  return (
    <article className="group w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-brand/40 hover:shadow-sm">
      <AppIcon
        name={app.name}
        iconUrl={app.iconUrl}
        containerClassName="relative h-16 w-16 overflow-hidden rounded-xl bg-white/10 shadow-sm ring-1 ring-black/5"
        fallbackClassName={`flex h-full w-full items-center justify-center text-base font-bold text-white ${app.iconBg}`}
        initialsClassName="leading-none"
        imageSizes="64px"
        imageOuterClassName="absolute inset-0 p-1.5"
        imageInnerClassName="relative size-full overflow-hidden rounded-lg"
        imageClassName="object-cover"
      />
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
