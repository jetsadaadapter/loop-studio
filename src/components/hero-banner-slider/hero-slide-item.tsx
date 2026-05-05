import Image from "next/image";
import Link from "next/link";
import { type HeroSlide, type HeroTheme } from "@/app/library/apps/hero.data";
import styles from "./styles.module.css";

const cardThemeClass: Record<HeroTheme, string> = {
  teal: styles.heroCardTeal,
  emerald: styles.heroCardEmerald,
  sky: styles.heroCardSky,
  indigo: styles.heroCardIndigo,
  cyan: styles.heroCardCyan,
  amber: styles.heroCardAmber,
  orange: styles.heroCardOrange,
  rose: styles.heroCardRose,
  stone: styles.heroCardStone,
  violet: styles.heroCardViolet,
  fuchsia: styles.heroCardFuchsia,
  slate: styles.heroCardSlate,
  zinc: styles.heroCardZinc,
};

const overlayThemeClass: Record<HeroTheme, string> = {
  teal: styles.heroOverlayTeal,
  emerald: styles.heroOverlayEmerald,
  sky: styles.heroOverlaySky,
  indigo: styles.heroOverlayIndigo,
  cyan: styles.heroOverlayCyan,
  amber: styles.heroOverlayAmber,
  orange: styles.heroOverlayOrange,
  rose: styles.heroOverlayRose,
  stone: styles.heroOverlayStone,
  violet: styles.heroOverlayViolet,
  fuchsia: styles.heroOverlayFuchsia,
  slate: styles.heroOverlaySlate,
  zinc: styles.heroOverlayZinc,
};

function getAppInitials(appName: string): string {
  const parts = appName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

type HeroSlideItemProps = {
  slide: HeroSlide;
  isPriority?: boolean;
  isSingleSlide?: boolean;
};

export function HeroSlideItem({
  slide,
  isPriority,
  isSingleSlide,
}: HeroSlideItemProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-slate-200 ${cardThemeClass[slide.theme]} ${
        isSingleSlide
          ? "w-full max-w-none lg:w-[44%] lg:max-w-162 lg:shrink-0 lg:snap-start xl:w-[43%]"
          : "w-[86vw] sm:w-[78vw] md:w-[66vw] lg:w-[44%] xl:w-[43%] max-w-162 shrink-0 snap-start"
      }`}
    >
      <div className="relative aspect-648/364">
        {slide.badge ? (
          <span className="absolute left-4 top-4 z-20 rounded-xl bg-white/85 px-3 py-1 text-sm font-medium text-slate-800">
            {slide.badge}
          </span>
        ) : null}

        <Image
          src={slide.imageUrl}
          alt={slide.title}
          fill
          sizes="(max-width: 640px) 86vw, (max-width: 768px) 78vw, (max-width: 1024px) 66vw, (max-width: 1280px) 44vw, 648px"
          className="object-cover"
          priority={isPriority}
          fetchPriority={isPriority ? "high" : undefined}
          loading={isPriority ? "eager" : "lazy"}
          unoptimized
        />

        <div
          className={`pointer-events-none absolute inset-0 ${overlayThemeClass[slide.theme]}`}
        />

        <div className="absolute inset-x-5 bottom-0 z-10">
          <h2 className="max-w-119.5 text-xl leading-tight font-medium tracking-[-0.01em] text-white sm:text-2xl sm:leading-[1.33]">
            {slide.title}
          </h2>
        </div>
      </div>

      <div className="-mt-px flex items-center gap-3 px-4 py-4 text-white md:px-5">
        {slide.appIconUrl ? (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl p-1.5 shadow-md ring-1 ring-white/25 bg-white/10">
            <div className="relative size-full overflow-hidden rounded-lg">
              <Image
                src={slide.appIconUrl}
                alt={`${slide.appName} icon`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/25 text-sm font-semibold tracking-wide text-white shadow-md ring-1 ring-white/25"
          >
            {getAppInitials(slide.appName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">{slide.appName}</p>
          <p className="truncate text-sm text-white/90">
            {slide.category}
            {slide.toolTags.length > 0 ? (
              <>
                <span className="mx-1">•</span>
                {slide.toolTags.join(" • ")}
              </>
            ) : null}
          </p>
        </div>

        <div className="text-right">
          <Link
            href={slide.actionUrl}
            target={slide.actionType === "linkout" ? "_blank" : undefined}
            rel={slide.actionType === "linkout" ? "noreferrer" : undefined}
            className="inline-flex h-8 items-center justify-center rounded-sm bg-white/22 px-3 text-sm font-medium whitespace-nowrap backdrop-blur-sm transition hover:bg-white/30"
          >
            {slide.ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
