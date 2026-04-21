import { cookies } from "next/headers";

import {
  AppCategoryRanking,
  type CategoryKey,
  type RankedApp,
} from "@/components/app-category-ranking";
import { getAppStatus, slugifyAppName } from "@/app/store/apps/data";
import { getApps } from "@/core/services/store.service";
import type { StoreAppApiItem } from "@/core/interfaces/store.interface";

type RankedAction = Pick<RankedApp, "actionType" | "actionUrl">;

function normalizeInternalPath(path: string): string {
  if (path.startsWith("/store/")) return path;
  if (path.startsWith("/apps/")) return `/store${path}`;
  if (path.startsWith("/")) return path;
  return `/store/apps/${path}`;
}

function mapAction(item: StoreAppApiItem): RankedAction {
  const derivedSlug = item.ctaLink?.startsWith("/apps/")
    ? item.ctaLink.replace(/^\/apps\//, "")
    : slugifyAppName(item.name);

  const actionType =
    item.linkType === "external"
      ? "linkout"
      : item.linkType === "instruction"
        ? "instruction"
        : "internal";

  const actionUrl =
    actionType === "linkout"
      ? (item.ctaLink ?? "https://store-api.adapterdigital.com")
      : actionType === "instruction"
        ? `/store/apps/${derivedSlug}`
        : item.ctaLink
          ? normalizeInternalPath(item.ctaLink)
          : `/store/apps/${derivedSlug}`;

  return { actionType, actionUrl };
}

function mapToRankedApps(items: StoreAppApiItem[]): RankedApp[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => {
      const action = mapAction(item);

      return {
        id: item.appId,
        rank: index + 1,
        name: item.name,
        category: item.category,
        meta: getAppStatus(item),
        imageUrl: item.imageUrl || item.iconUrl || "",
        actionType: action.actionType,
        actionUrl: action.actionUrl,
      };
    });
}

async function fetchRankingData(): Promise<Record<
  CategoryKey,
  RankedApp[]
> | null> {
  try {
    const cookieStore = await cookies();
    const ztToken = cookieStore.get("zt_token")?.value;

    const response = await getApps(
      { limit: 100 },
      {
        next: { revalidate: 60 },
        headers: ztToken ? { Authorization: `Bearer ${ztToken}` } : undefined,
      },
    );

    const rankingData: Record<CategoryKey, RankedApp[]> = {
      mcp: [],
      platform: [],
      tool: [],
    };

    for (const group of response.data) {
      const key = group.group.toLowerCase() as CategoryKey;
      if (key in rankingData) {
        rankingData[key] = mapToRankedApps(group.items);
      }
    }

    return rankingData;
  } catch {
    return null;
  }
}

export async function StoreCategoryRankingBlock() {
  const rankingData = await fetchRankingData();

  if (rankingData) {
    return <AppCategoryRanking rankingData={rankingData} />;
  }

  return <AppCategoryRanking />;
}
