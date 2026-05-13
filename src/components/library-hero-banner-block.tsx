/* eslint-disable react-hooks/error-boundaries */
import { redirect } from "next/navigation";
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { getBanners, ApiError } from "@/core/services/library.service";
import {
  heroBannerMock,
  mapBannerToHeroSlide,
  type HeroSlide,
} from "@/app/library/apps/hero.data";

export async function LibraryHeroBannerBlock() {
  try {
    const response = await getBanners(undefined, {
      next: { revalidate: 60 },
    });
    console.log("[LibraryHeroBannerBlock] getBanners response:", response);
    const slides = response.data
      .map((item, idx) => {
        try {
          return mapBannerToHeroSlide(item);
        } catch (err) {
          console.error(
            `[LibraryHeroBannerBlock] mapBannerToHeroSlide error at index ${idx}:`,
            err,
            item,
          );
          return null;
        }
      })
      .filter(Boolean) as HeroSlide[];
    console.log("[LibraryHeroBannerBlock] mapped slides:", slides);

    if (slides.length === 0) {
      return <HeroBannerSlider initialSlides={heroBannerMock.items} />;
    }

    return <HeroBannerSlider initialSlides={slides} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    console.error("[LibraryHeroBannerBlock] getBanners error:", error);
    return <HeroBannerSlider initialSlides={heroBannerMock.items} />;
  }
}
