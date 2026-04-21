/* eslint-disable react-hooks/error-boundaries */
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { getBanners } from "@/core/services/store.service";
import { cookies } from "next/headers";
import {
  heroBannerMock,
  mapBannerToHeroSlide,
} from "@/app/store/apps/hero.data";

export async function StoreHeroBannerBlock() {
  try {
    const cookieStore = await cookies();
    const ztToken = cookieStore.get("zt_token")?.value;

    const response = await getBanners(undefined, {
      next: { revalidate: 60 },
      headers: ztToken ? { Authorization: `Bearer ${ztToken}` } : undefined,
    });

    const slides = response.data.map(mapBannerToHeroSlide);

    if (slides.length === 0) {
      return <HeroBannerSlider initialSlides={heroBannerMock.items} />;
    }

    return <HeroBannerSlider initialSlides={slides} />;
  } catch {
    return <HeroBannerSlider initialSlides={heroBannerMock.items} />;
  }
}
