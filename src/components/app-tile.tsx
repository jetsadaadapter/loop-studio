import { type LibraryApp } from "@/app/library/apps/data";
import { AppIcon } from "@/components/app-icon";
import { getAppBadgeClass } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export function AppTile({ app }: { app: LibraryApp }) {
  return (
    <Link
      href={`/apps/${app.id}`}
      className="group block h-full w-full rounded-2xl sm:rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
    >
      <article className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-[0_10px_24px_-22px_rgba(15,23,42,0.45)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:shadow-[0_18px_34px_-22px_rgba(15,23,42,0.35)]">
        <div className="relative aspect-4/3 overflow-hidden rounded-t-2xl sm:rounded-t-3xl bg-slate-100">
          {app.imageUrl ? (
            <Image
              src={app.imageUrl}
              alt={`${app.name} cover`}
              fill
              sizes="(max-width: 640px) 256px, 272px"
              className="object-cover transition duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 p-4">
              <span className="text-center text-xl font-bold tracking-widest text-slate-400/30 uppercase">
                No image available
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-b from-white/5 via-slate-900/6 to-slate-900/28" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-white via-white/80 to-transparent" />
        </div>

        <div className="relative px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5 pt-0">
          <div className="-mt-8 sm:-mt-10">
            <AppIcon
              name={app.name}
              iconUrl={app.iconUrl}
              containerClassName="relative h-11 w-11 sm:h-14 sm:w-14 overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-[0_10px_20px_-14px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80 transition duration-200 group-hover:scale-[1.03]"
              fallbackClassName={`flex h-full w-full items-center justify-center text-xs sm:text-sm font-bold text-white ${app.iconBg}`}
              initialsClassName="leading-none"
              imageSizes="(max-width: 640px) 44px, 56px"
              imageOuterClassName="absolute inset-0 p-1 sm:p-1.5"
              imageInnerClassName="relative size-full overflow-hidden rounded-lg sm:rounded-xl"
              imageClassName="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>

          <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5">
            <h3 className="line-clamp-1 text-xs sm:text-sm font-semibold tracking-tight text-slate-900">
              {app.name}
            </h3>
            <p className="line-clamp-1 text-[10px] sm:text-xs text-slate-500">
              {app.category}
            </p>
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              {app.badge ? (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] sm:px-2.5 sm:text-xs font-bold ${getAppBadgeClass(app.badge)}`}>
                  {app.badge}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
