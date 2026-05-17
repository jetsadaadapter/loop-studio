"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LibraryFilterToolbar } from "@/components/library-filter-toolbar";
import { LibraryAppSections } from "@/components/library-app-sections";
import { useLibraryShell } from "@/app/library/library-shell";
import {
  mainTabs,
  badgeFilters,
  type LibrarySection,
  type MainTabKey,
  type BadgeFilterKey,
} from "./data";

type LibraryAppsClientProps = {
  sections: LibrarySection[];
  children?: ReactNode;
};

export function LibraryAppsClient({
  sections,
  children,
}: LibraryAppsClientProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeFilterKey | null>(
    null,
  );
  const {
    searchQuery,
    activeCategory,
    setActiveCategory,
    setVisibleCategoryKeys,
  } = useLibraryShell();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  console.log(
    "[LibraryAppsClient] Received sections:",
    sections.map((s) => ({ id: s.id, itemCount: s.items.length })),
  );
  console.log("[LibraryAppsClient] Selected tab:", activeCategory);

  const visibleMainTabs = useMemo(() => {
    const availableSectionIds = new Set(
      sections.filter((section) => section.items.length > 0).map((s) => s.id),
    );

    return mainTabs.filter((tab) => availableSectionIds.has(tab.key));
  }, [sections]);

  useEffect(() => {
    setVisibleCategoryKeys(visibleMainTabs.map((t) => t.key));
  }, [visibleMainTabs, setVisibleCategoryKeys]);

  const effectiveMainTab: MainTabKey | null =
    activeCategory && visibleMainTabs.some((tab) => tab.key === activeCategory)
      ? activeCategory
      : null;

  const baseSections = useMemo(() => {
    const filtered = effectiveMainTab
      ? sections.filter((s) => s.id === effectiveMainTab)
      : sections;

    const nonEmpty = filtered.filter((section) => section.items.length > 0);

    console.log(
      `[LibraryAppsClient] After tab filter (${effectiveMainTab ?? "all"}):`,
      nonEmpty.length,
      "sections",
    );

    return nonEmpty;
  }, [sections, effectiveMainTab]);

  const searchedSections = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) return baseSections;

    return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((app) => {
          const searchableText = `${app.name} ${app.category}`.toLowerCase();
          return searchableText.includes(normalizedQuery);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [baseSections, deferredSearchQuery]);

  const badgeCounts = useMemo(() => {
    const allApps = searchedSections.flatMap((s) => s.items);
    return badgeFilters.reduce<Record<BadgeFilterKey, number>>(
      (acc, filter) => {
        acc[filter.key] =
          filter.key === "all"
            ? allApps.length
            : allApps.filter((app) => app.badge?.toLowerCase() === filter.key)
                .length;
        return acc;
      },
      {
        all: 0,
        new: 0,
        trending: 0,
        hot: 0,
        "coming soon": 0,
      },
    );
  }, [searchedSections]);

  const visibleBadgeFilters = useMemo(
    () =>
      badgeFilters.filter(
        (f) => f.key !== "all" && badgeCounts[f.key] > 0,
      ),
    [badgeCounts],
  );

  const shouldShowBadgeFilters = effectiveMainTab !== null;

  const effectiveBadge: BadgeFilterKey =
    selectedBadge && visibleBadgeFilters.some((f) => f.key === selectedBadge)
      ? selectedBadge
      : "all";

  const filteredSections = useMemo(() => {
    if (effectiveBadge === "all") return searchedSections;
    return searchedSections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (app) => app.badge?.toLowerCase() === effectiveBadge,
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [searchedSections, effectiveBadge]);

  return (
    <>
      <LibraryFilterToolbar
        tabs={visibleMainTabs}
        selectedTab={effectiveMainTab}
        onTabChange={(tabKey) => {
          const next = activeCategory === tabKey ? null : tabKey;
          setActiveCategory(next);
          setSelectedBadge(next ? "all" : null);
        }}
        filters={shouldShowBadgeFilters ? visibleBadgeFilters : []}
        selectedFilter={selectedBadge}
        filterCounts={badgeCounts}
        onFilterChange={setSelectedBadge}
      />

      {children}

      <LibraryAppSections sections={filteredSections} />
    </>
  );
}
