import { redirect } from "next/navigation";
import {
  LibraryPageBlocks,
  LIBRARY_BLOCK_PRESETS,
} from "@/components/library-page-blocks";
import { LibraryAppsClient } from "@/app/library/apps/library-apps-client";
import { getApps, ApiError } from "@/core/services/library.service";
import {
  mapAppsResponseToSections,
  type LibrarySection,
} from "@/app/library/apps/data";

export default async function LibraryAppsPage() {
  let sections: LibrarySection[] = [];

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
      redirect("/api/auth/logout");
    }
    console.error("Failed to fetch /library/apps", error);
  }

  return (
    <>
      <LibraryAppsClient sections={sections}>
        <LibraryPageBlocks blocks={LIBRARY_BLOCK_PRESETS.marketplace} />
      </LibraryAppsClient>

      <LibraryPageBlocks blocks={LIBRARY_BLOCK_PRESETS.marketplaceFooter} />
    </>
  );
}
