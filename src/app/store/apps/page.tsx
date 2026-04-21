import { cookies } from "next/headers";
import {
  StorePageBlocks,
  STORE_BLOCK_PRESETS,
} from "@/components/store-page-blocks";
import { StoreAppsClient } from "@/app/store/apps/store-apps-client";
import { getApps } from "@/core/services/store.service";
import {
  mapAppsResponseToSections,
  type StoreSection,
} from "@/app/store/apps/data";

export default async function StoreAppsPage() {
  let sections: StoreSection[] = [];

  try {
    const cookieStore = await cookies();
    const ztToken = cookieStore.get("zt_token")?.value;
    const response = await getApps(
      {},
      {
        next: { revalidate: 60 },
        headers: ztToken ? { Authorization: `Bearer ${ztToken}` } : undefined,
      },
    );
    sections = mapAppsResponseToSections(response);
  } catch (error) {
    console.error("Failed to fetch /store/apps", error);
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
