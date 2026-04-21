import { cookies } from "next/headers";

import {
  AppCategoryRanking,
  type CategoryKey,
  type RankedApp,
} from "@/components/app-category-ranking";
import { getAppStatus, getStableIconBg } from "@/app/store/apps/data";
import { getApps } from "@/core/services/store.service";
import type { StoreAppApiItem } from "@/core/interfaces/store.interface";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function mapToRankedApps(items: StoreAppApiItem[]): RankedApp[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      id: item.appId,
      rank: index + 1,
      name: item.name,
      category: item.category,
      meta: getAppStatus(item),
      iconText: getInitials(item.name),
      iconClassName: getStableIconBg(item.appId),
    }));
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
