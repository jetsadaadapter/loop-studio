"use client";

import { ChevronLeft, ChevronRight, MoveRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type CategoryKey,
  type RankedApp,
  categoryTabs,
  FALLBACK_RANKING_DATA,
  APP_IMAGE_BY_ID,
  DEFAULT_APP_IMAGE,
} from "./data";

export type { CategoryKey, RankedApp };

type AppCategoryRankingProps = {
  rankingData?: Record<CategoryKey, RankedApp[]>;
};

export function AppCategoryRanking({
  rankingData = FALLBACK_RANKING_DATA,
}: AppCategoryRankingProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("tool");
  const [renderedCategory, setRenderedCategory] = useState<CategoryKey>("tool");
  const [isSliderVisible, setIsSliderVisible] = useState(true);
  const [canSlideLeft, setCanSlideLeft] = useState(false);
  const [canSlideRight, setCanSlideRight] = useState(true);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayedApps = rankingData[renderedCategory] ?? [];

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  function updateSliderBounds() {
    const slider = sliderRef.current;
    if (!slider) return;
    setCanSlideLeft(slider.scrollLeft > 2);
    setCanSlideRight(
      slider.scrollLeft < slider.scrollWidth - slider.clientWidth - 2,
    );
  }

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.scrollLeft = 0;
    updateSliderBounds();
  }, [renderedCategory]);

  useEffect(() => {
    updateSliderBounds();
    window.addEventListener("resize", updateSliderBounds);
    return () => window.removeEventListener("resize", updateSliderBounds);
  }, []);

  function goToCategory(nextCategory: CategoryKey) {
    if (nextCategory === selectedCategory) return;
    setSelectedCategory(nextCategory);
    setIsSliderVisible(false);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setRenderedCategory(nextCategory);
      setIsSliderVisible(true);
    }, 160);
  }

  function scrollSlider(direction: "left" | "right") {
    const slider = sliderRef.current;
    if (!slider) return;
    const cardWidth = slider.querySelector("article")?.clientWidth ?? 320;
    slider.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  }

  function handleSliderScroll() {
    updateSliderBounds();
  }

  function getAppImageUrl(app: RankedApp) {
    return app.imageUrl || APP_IMAGE_BY_ID[app.id] || DEFAULT_APP_IMAGE;
  }

  function getAppActionUrl(app: RankedApp) {
    return app.actionUrl || `/apps/${app.id}`;
  }

  return (
    <section
      className="mt-10 w-full overflow-x-hidden py-4"
      aria-label="App categories"
    >
      <h2 className="text-pretty text-xl font-bold leading-tight text-slate-950 sm:text-2xl lg:text-[1.75rem]">
        Top Charts Across Categories
      </h2>

      <div
        className="mt-6 grid gap-x-8 gap-y-8 lg:mt-12 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-10"
        role="region"
        aria-roledescription="carousel"
      >
        {/* LEFT: category links — 3rd on mobile, 1st col on desktop */}
        <div className="order-3 flex flex-col gap-4 sm:gap-6 lg:order-0">
          {categoryTabs.map((tab, index) => {
            const isActive = tab.key === selectedCategory;
            return (
              <div key={tab.key}>
                <div className="flex flex-col gap-1">
                  <div className="text-xs uppercase tracking-widest text-slate-400">
                    {tab.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => goToCategory(tab.key)}
                    aria-current={isActive ? "true" : undefined}
                    className={`group flex items-center gap-2 text-left text-sm font-semibold transition-colors sm:text-base ${
                      isActive
                        ? "text-slate-950"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {tab.description}
                    <MoveRight
                      className={`mt-0.5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
                        isActive ? "text-slate-700" : "text-slate-300"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {index < categoryTabs.length - 1 && (
                  <hr className="mt-6 border-slate-200" />
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: scrollable carousel — 1st on mobile, spans 2 cols on desktop */}
        <div
          className={`order-1 min-w-0 overflow-hidden lg:order-0 lg:col-span-2 transition-opacity duration-300 ${
            isSliderVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="flex w-full max-w-full select-none overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {displayedApps.map((app, index) => (
              <article
                key={app.id}
                role="group"
                aria-roledescription="slide"
                className={`min-w-0 shrink-0 grow-0 basis-full border-y border-l border-slate-200 transition-colors duration-300 hover:bg-slate-50/80 sm:basis-1/2 ${
                  index === displayedApps.length - 1 ? "border-r" : ""
                }`}
              >
                <Link
                  href={getAppActionUrl(app)}
                  target={app.actionType === "linkout" ? "_blank" : undefined}
                  rel={app.actionType === "linkout" ? "noreferrer" : undefined}
                  className="block h-full"
                >
                  <div className="flex aspect-video items-center justify-center bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getAppImageUrl(app)}
                      alt={app.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        const target = event.currentTarget;
                        target.onerror = null;
                        target.src = DEFAULT_APP_IMAGE;
                      }}
                    />
                  </div>
                  <div className="px-5 py-5">
                    <div className="text-xs uppercase tracking-widest text-slate-400">
                      {app.category}
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold leading-snug text-slate-950 sm:text-base">
                      {app.name}
                    </h3>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* NAV arrows — 2nd on mobile, below carousel start on desktop */}
        <div className="order-2 flex items-center gap-4 lg:order-0 lg:col-start-2">
          <button
            type="button"
            onClick={() => scrollSlider("left")}
            disabled={!canSlideLeft}
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 sm:size-12"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
            <span className="sr-only">Previous slide</span>
          </button>
          <button
            type="button"
            onClick={() => scrollSlider("right")}
            disabled={!canSlideRight}
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 sm:size-12"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
            <span className="sr-only">Next slide</span>
          </button>
        </div>
      </div>
    </section>
  );
}
