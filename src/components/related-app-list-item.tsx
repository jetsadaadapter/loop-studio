import Link from "next/link";
import { slugifyAppName } from "@/app/store/apps/data";
import { AppIcon } from "@/components/app-icon";
import type { StoreAppApiItem } from "@/core/interfaces/store.interface";

type RelatedAppListItemProps = {
  item: StoreAppApiItem;
};

export function RelatedAppListItem({ item }: RelatedAppListItemProps) {
  return (
    <Link
      href={`/apps/${slugifyAppName(item.name)}`}
      className="flex items-start gap-3 rounded-2xl p-1.5 transition hover:bg-slate-100/80"
    >
      <AppIcon
        name={item.name}
        iconUrl={item.iconUrl}
        containerClassName="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 shadow-md ring-1 ring-white/25"
        fallbackClassName="flex h-full w-full items-center justify-center bg-white/25 text-sm font-semibold tracking-wide text-white"
        initialsClassName="text-sm font-semibold tracking-wide"
        imageSizes="56px"
        imageOuterClassName="absolute inset-0 p-1.5"
        imageInnerClassName="relative size-full overflow-hidden rounded-lg"
        imageClassName="object-cover"
      />
      <div className="min-w-0 pt-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {item.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {item.category}
        </p>
      </div>
    </Link>
  );
}
