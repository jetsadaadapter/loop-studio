import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import {
  LibraryPageBlocks,
  LIBRARY_BLOCK_PRESETS,
} from "@/components/library-page-blocks";
import { LibraryAppsClient } from "@/app/library/apps/library-apps-client";
import { getApps } from "@/core/services/apps.service";
import { ApiError } from "@/core/services/api";
import {
  mapAppsResponseToSections,
  type LibrarySection,
} from "@/app/library/apps/data";

// Mark this route as dynamic since it accesses cookies and user auth
export const dynamic = "force-dynamic";

export default async function LibraryAppsPage() {
  noStore();
  let sections: LibrarySection[] = [];
  let fetchError: string | null = null;

  try {
    console.log("[LibraryAppsPage] Starting fetch...");
    const response = await getApps(
      {},
      {
        next: { revalidate: 60 },
      },
    );
    console.log("[LibraryAppsPage] API response received");
    sections = mapAppsResponseToSections(response);
    console.log("[LibraryAppsPage] Mapping complete");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      console.error("[LibraryAppsPage] Unauthorized - redirecting to logout");
      redirect("/api/auth/logout");
    }
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[LibraryAppsPage] Failed to fetch /apps:", errorMsg);
    fetchError = errorMsg;
  }

  return (
    <>
      {fetchError && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>Alert</span>
          <div>
            <p className="font-medium">Failed to load apps</p>
            <p className="text-xs text-red-700">{fetchError}</p>
          </div>
        </div>
      )}
      <LibraryAppsClient sections={sections}>
        <LibraryPageBlocks blocks={LIBRARY_BLOCK_PRESETS.marketplace} />
      </LibraryAppsClient>

      <LibraryPageBlocks blocks={LIBRARY_BLOCK_PRESETS.marketplaceFooter} />
    </>
  );
}
