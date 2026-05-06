import { redirect } from "next/navigation";

import {
  AppCategoryRanking,
  type CategoryKey,
  type RankedApp,
} from "@/components/app-category-ranking";
import { getAppStatus } from "@/app/library/apps/data";
import { getApps, ApiError } from "@/core/services/library.service";
import {
  getAppItemId,
  type LibraryAppApiItem,
} from "@/core/interfaces/library.interface";

type RankedAction = Pick<RankedApp, "actionType" | "actionUrl">;

function normalizeInternalPath(path: string): string {
  if (path.startsWith("/apps/")) return path;
  if (path.startsWith("/")) return path;
  return `/apps/${path}`;
}

function mapAction(item: LibraryAppApiItem): RankedAction {
  const appDetailPath = `/apps/${getAppItemId(item)}`;

  const actionType =
    item.linkType === "external"
      ? "linkout"
      : item.linkType === "instruction"
        ? "instruction"
        : "internal";

  const actionUrl =
    actionType === "linkout"
      ? (item.ctaLink ?? "https://library-api.adapterdigital.com")
      : actionType === "instruction"
        ? appDetailPath
        : item.ctaLink
          ? item.ctaLink.startsWith("/apps/")
            ? appDetailPath
            : normalizeInternalPath(item.ctaLink)
          : appDetailPath;

  return { actionType, actionUrl };
}

function mapToRankedApps(items: LibraryAppApiItem[]): RankedApp[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => {
      const action = mapAction(item);

      return {
        id: getAppItemId(item),
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
    const response = await getApps(
      { limit: 100 },
      {
        next: { revalidate: 60 },
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
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    return null;
  }
}

export async function LibraryCategoryRankingBlock() {
  const rankingData = await fetchRankingData();

  if (rankingData) {
    return <AppCategoryRanking rankingData={rankingData} />;
  }

  return <AppCategoryRanking />;
}
