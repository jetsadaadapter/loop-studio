import { type StoreApp } from "@/app/store/apps/data";
import { AppIcon } from "@/components/app-icon";
import { statusBadgeClass } from "@/lib/utils";
import Link from "next/link";

export function AppTile({ app }: { app: StoreApp }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
    >
      <article className="relative w-40 shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.45)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:shadow-[0_18px_34px_-22px_rgba(15,23,42,0.35)] sm:w-48">
        <AppIcon
          name={app.name}
          iconUrl={app.iconUrl}
          containerClassName="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition duration-200 group-hover:scale-[1.03]"
          fallbackClassName={`flex h-full w-full items-center justify-center text-base font-bold text-white ${app.iconBg}`}
          initialsClassName="leading-none"
          imageSizes="64px"
          imageOuterClassName="absolute inset-0 p-1.5"
          imageInnerClassName="relative size-full overflow-hidden rounded-xl"
          imageClassName="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="mt-3 space-y-1.5">
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-slate-900">
            {app.name}
          </h3>
          <p className="line-clamp-1 text-sm text-slate-500">{app.category}</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(app.status)}`}
          >
            {app.status}
          </span>
        </div>
      </article>
    </Link>
  );
}
