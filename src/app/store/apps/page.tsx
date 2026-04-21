import {
  StorePageBlocks,
  STORE_BLOCK_PRESETS,
} from "@/components/store-page-blocks";
import { StoreAppsClient } from "@/app/store/apps/store-apps-client";

export default function StoreAppsPage() {
  return (
    <StoreAppsClient>
      <StorePageBlocks blocks={STORE_BLOCK_PRESETS.marketplace} />
    </StoreAppsClient>
  );
}
