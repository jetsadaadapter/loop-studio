"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getBanners } from "@/core/services/store.service";
import {
  heroBannerMock,
  mapBannerToHeroSlide,
  type HeroSlide,
  type HeroTheme,
} from "@/app/store/apps/hero.data";
import styles from "./styles.module.css";

const FALLBACK_HERO_SLIDES: HeroSlide[] = heroBannerMock.items;

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

type HeroBannerSliderProps = {
  initialSlides?: HeroSlide[];
};

export function HeroBannerSlider({ initialSlides }: HeroBannerSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    if (initialSlides && initialSlides.length > 0) return initialSlides;
    return FALLBACK_HERO_SLIDES;
  });
  const [isLoading, setIsLoading] = useState(!initialSlides);
  const [hasError, setHasError] = useState(false);

  const fetchBanners = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setHasError(false);
    }

    try {
      const response = await getBanners();
      const mapped = response.data.map(mapBannerToHeroSlide);

      if (mapped.length > 0) {
        setHeroSlides(mapped);
      } else {
        setHeroSlides(FALLBACK_HERO_SLIDES);
      }
    } catch {
      setHasError(true);
      setHeroSlides(FALLBACK_HERO_SLIDES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSlides || initialSlides.length === 0) {
      queueMicrotask(() => {
        void fetchBanners(false);
      });
    }
  }, [initialSlides, fetchBanners]);

  const updateArrowState = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const maxScroll = slider.scrollWidth - slider.clientWidth;
    setCanScrollPrev(slider.scrollLeft > 8);
    setCanScrollNext(slider.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateArrowState();

    const slider = sliderRef.current;
    if (!slider) return;

    const handleResize = () => updateArrowState();

    slider.addEventListener("scroll", updateArrowState, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      slider.removeEventListener("scroll", updateArrowState);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateArrowState]);

  const handlePrev = () => {
    const slider = sliderRef.current;
    if (!slider) return;

    const viewport = slider.clientWidth;
    slider.scrollBy({ left: -Math.round(viewport * 0.78), behavior: "smooth" });
  };

  const handleNext = () => {
    const slider = sliderRef.current;
    if (!slider) return;

    const viewport = slider.clientWidth;
    slider.scrollBy({ left: Math.round(viewport * 0.78), behavior: "smooth" });
  };

  return (
    <section className="mt-6">
      {hasError ? (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>Unable to refresh banners. Showing fallback content.</span>
          <button
            type="button"
            onClick={() => void fetchBanners()}
            className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-74 w-[86vw] max-w-162 shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 sm:w-[78vw] md:w-[66vw] lg:w-[44%] xl:w-[43%]"
            />
          ))}
        </div>
      ) : null}

      <div className="group relative">
        <div
          ref={sliderRef}
          role="list"
          aria-label="Featured app stories"
          className={`flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isLoading ? "hidden" : ""}`}
        >
          {heroSlides.map((slide) => (
            <article
              key={slide.heroId}
              role="listitem"
              className={`relative w-[86vw] sm:w-[78vw] md:w-[66vw] lg:w-[44%] xl:w-[43%] max-w-162 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 ${cardThemeClass[slide.theme]}`}
            >
              <div className="relative aspect-648/364">
                {slide.badge ? (
                  <span className="absolute left-4 top-4 z-20 rounded-xl bg-white/85 px-3 py-1 text-sm font-medium text-slate-800">
                    {slide.badge}
                  </span>
                ) : null}

                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 86vw, (max-width: 768px) 78vw, (max-width: 1024px) 66vw, (max-width: 1280px) 44vw, 648px"
                  className="object-cover"
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

              <div className="flex items-center gap-3 px-4 py-4 text-white md:px-5">
                {slide.appIconUrl ? (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl p-1.5 shadow-md ring-1 ring-white/25 bg-white/10">
                    <div className="relative size-full overflow-hidden rounded-lg">
                      <Image
                        src={slide.appIconUrl}
                        alt={`${slide.appName} icon`}
                        fill
                        className="object-cover"
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
                  <p className="truncate text-base font-medium">
                    {slide.appName}
                  </p>
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
                    target={
                      slide.actionType === "linkout" ? "_blank" : undefined
                    }
                    rel={
                      slide.actionType === "linkout" ? "noreferrer" : undefined
                    }
                    className="inline-flex h-8 w-21.5 items-center justify-center rounded-sm bg-white/22 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                  >
                    {slide.ctaLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {canScrollPrev ? (
          <button
            type="button"
            aria-label="Previous hero banner"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-slate-50 lg:inline-flex"
          >
            <ChevronRight className="size-7 rotate-180" />
          </button>
        ) : null}

        {canScrollNext ? (
          <button
            type="button"
            aria-label="Next hero banner"
            onClick={handleNext}
            className="absolute right-3 top-1/2 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-slate-50 lg:inline-flex"
          >
            <ChevronRight className="size-7" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
