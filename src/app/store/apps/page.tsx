import { redirect } from "next/navigation";
import {
  StorePageBlocks,
  STORE_BLOCK_PRESETS,
} from "@/components/store-page-blocks";
import { StoreAppsClient } from "@/app/store/apps/store-apps-client";
import { getApps, ApiError } from "@/core/services/store.service";
import {
  mapAppsResponseToSections,
  type StoreSection,
} from "@/app/store/apps/data";

export default async function StoreAppsPage() {
  let sections: StoreSection[] = [];

  try {
    const response = await getApps(
      {},
      {
        next: { revalidate: 60 },
      },
    );
    sections = mapAppsResponseToSections(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    console.error("Failed to fetch /library/apps", error);
  }

  return (
    <>
      <StoreAppsClient sections={sections}>
        <StorePageBlocks blocks={STORE_BLOCK_PRESETS.marketplace} />
      </StoreAppsClient>

      <StorePageBlocks blocks={STORE_BLOCK_PRESETS.marketplaceFooter} />
    </>
  );
}
