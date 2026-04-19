"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import styles from "./hero-banner-slider.module.css";

type HeroTheme = "canva" | "storytel" | "tiktok";

type HeroSlide = {
  id: string;
  theme: HeroTheme;
  statusLabel?: string;
  title: string;
  imageUrl: string;
  appIconUrl: string;
  appName: string;
  publisher: string;
  contentRating: string;
  installCta: string;
  monetization: string;
};

const heroSlides: HeroSlide[] = [
  {
    id: "canva",
    theme: "canva",
    statusLabel: "Update available",
    title: "Sweeten the moment with Disney's Winnie the Pooh",
    imageUrl:
      "https://play-lh.googleusercontent.com/P9vq5hCiH7K82-1RorfTgOP3NkWWm67JfP8ub3-cAeGm2MTdtIPN6cepMfL0FwDTg544la0WAc_hO85S3S9X=w1296-h728-rw",
    appIconUrl:
      "https://play-lh.googleusercontent.com/tUZNUbnNGw8I6uLg8Zy2ZWbmSFuT5kK0dYA8tdqNmldlozNS_jSjDw5j2nElRsoTzQ=s128-rw",
    appName: "Canva: AI Photo & Video Editor",
    publisher: "Canva",
    contentRating: "Rated for 3+",
    installCta: "Install",
    monetization: "In-app purchases",
  },
  {
    id: "storytel",
    theme: "storytel",
    statusLabel: "Update available",
    title: "Discover Inspiring Stories for World Book Day",
    imageUrl:
      "https://play-lh.googleusercontent.com/TM0phEutSyIFeDGW3UAGLExe73xuRbYEfKVKQxHAcfzKoAj-GA6mW-UvjqYwg7bjx5tigo6T2el2z7tDsPBWas4=w1296-h728-rw",
    appIconUrl:
      "https://play-lh.googleusercontent.com/ufvs48ZAzaZLOsW5l3Rw3xrSwKtkt0FEGfLWYd8Dmmw2bJJP_faRr0WesNq_rCqGCg=s128-rw",
    appName: "Storytel - Audiobooks & Books",
    publisher: "Storytel Sweden AB",
    contentRating: "Rated for 12+",
    installCta: "Install",
    monetization: "In-app purchases",
  },
  {
    id: "tiktok",
    theme: "tiktok",
    statusLabel: "Update available",
    title: "Grow your Streak Pet",
    imageUrl:
      "https://play-lh.googleusercontent.com/IX4byfOj5CuZ6sqAubPF7LEea2rDAzk4s_b9y7V_D-LdnKTWvnH9IPB04akwZKvI2BFuXgdVWYd5TYOax29e8w=w1296-h728-rw",
    appIconUrl:
      "https://play-lh.googleusercontent.com/Ui_-OW6UJI147ySDX9guWWDiCPSq1vtxoC-xG17BU2FpU0Fi6qkWwuLdpddmT9fqrA=s128-rw",
    appName: "TikTok",
    publisher: "TikTok Pte. Ltd.",
    contentRating: "Rated for 12+",
    installCta: "Install",
    monetization: "In-app purchases",
  },
];

const cardThemeClass: Record<HeroTheme, string> = {
  canva: styles.heroCardCanva,
  storytel: styles.heroCardStorytel,
  tiktok: styles.heroCardTiktok,
};

const overlayThemeClass: Record<HeroTheme, string> = {
  canva: styles.heroOverlayCanva,
  storytel: styles.heroOverlayStorytel,
  tiktok: styles.heroOverlayTiktok,
};

export function HeroBannerSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

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
      <div className="group relative">
        <div
          ref={sliderRef}
          role="list"
          aria-label="Featured app stories"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {heroSlides.map((slide) => (
            <article
              key={slide.id}
              role="listitem"
              className={`relative w-[86vw] sm:w-[78vw] md:w-[66vw] lg:w-[44%] xl:w-[43%] max-w-162 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 ${cardThemeClass[slide.theme]}`}
            >
              <div className="relative aspect-648/364">
                {slide.statusLabel ? (
                  <span className="absolute left-4 top-4 z-20 rounded-xl bg-white/85 px-3 py-1 text-sm font-medium text-slate-800">
                    {slide.statusLabel}
                  </span>
                ) : null}

                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
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
                <Image
                  src={slide.appIconUrl}
                  alt={`${slide.appName} icon`}
                  width={56}
                  height={56}
                  className="size-14 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">
                    {slide.appName}
                  </p>
                  <p className="truncate text-sm text-white/90">
                    {slide.publisher} <span className="mx-1">•</span>
                    {slide.contentRating}
                  </p>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    className="inline-flex h-8 w-21.5 items-center justify-center rounded-sm bg-white/22 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                  >
                    {slide.installCta}
                  </button>
                  <p className="mt-1 text-sm text-white/90">
                    {slide.monetization}
                  </p>
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
