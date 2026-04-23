"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getBanners } from "@/core/services/store.service";
import {
  heroBannerMock,
  mapBannerToHeroSlide,
  type HeroSlide,
} from "@/app/store/apps/hero.data";
import { HeroSlideItem } from "./hero-slide-item";

const FALLBACK_HERO_SLIDES: HeroSlide[] = heroBannerMock.items;

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
          {heroSlides.map((slide, index) => (
            <HeroSlideItem 
              key={slide.heroId} 
              slide={slide} 
              isPriority={index === 0} 
            />
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
