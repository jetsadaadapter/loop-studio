/* eslint-disable react-hooks/error-boundaries */
import { redirect } from "next/navigation";
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { getBanners, ApiError } from "@/core/services/store.service";
import {
  heroBannerMock,
  mapBannerToHeroSlide,
} from "@/app/store/apps/hero.data";

export async function StoreHeroBannerBlock() {
  try {
    const response = await getBanners(undefined, {
      next: { revalidate: 60 },
    });

    const slides = response.data.map(mapBannerToHeroSlide);

    if (slides.length === 0) {
      return <HeroBannerSlider initialSlides={heroBannerMock.items} />;
    }

    return <HeroBannerSlider initialSlides={slides} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    return <HeroBannerSlider initialSlides={heroBannerMock.items} />;
  }
}
