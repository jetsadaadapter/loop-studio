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
  statusFilters,
  type LibrarySection,
  type MainTabKey,
  type StatusFilterKey,
} from "./data";

type LibraryAppsClientProps = {
  sections: LibrarySection[];
  children?: ReactNode;
};

export function LibraryAppsClient({
  sections,
  children,
}: LibraryAppsClientProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterKey | null>(
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

  const statusCounts = useMemo(() => {
    const allApps = searchedSections.flatMap((s) => s.items);
    return statusFilters.reduce<Record<StatusFilterKey, number>>(
      (acc, filter) => {
        acc[filter.key] =
          filter.key === "all"
            ? allApps.length
            : allApps.filter((app) => app.status.toLowerCase() === filter.key)
                .length;
        return acc;
      },
      {
        all: 0,
        "production ready": 0,
        "in rollout": 0,
        beta: 0,
        planned: 0,
        new: 0,
      },
    );
  }, [searchedSections]);

  const visibleStatusFilters = useMemo(
    () =>
      statusFilters.filter((f) => f.key === "all" || statusCounts[f.key] > 0),
    [statusCounts],
  );

  const shouldShowStatusFilters = effectiveMainTab !== null;

  const effectiveStatus: StatusFilterKey =
    selectedStatus && visibleStatusFilters.some((f) => f.key === selectedStatus)
      ? selectedStatus
      : "all";

  const filteredSections = useMemo(() => {
    if (effectiveStatus === "all") return searchedSections;
    return searchedSections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (app) => app.status.toLowerCase() === effectiveStatus,
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [searchedSections, effectiveStatus]);

  return (
    <>
      <LibraryFilterToolbar
        tabs={visibleMainTabs}
        selectedTab={effectiveMainTab}
        onTabChange={(tabKey) => {
          const next = activeCategory === tabKey ? null : tabKey;
          setActiveCategory(next);
          setSelectedStatus(next ? "all" : null);
        }}
        filters={shouldShowStatusFilters ? visibleStatusFilters : []}
        selectedFilter={selectedStatus}
        filterCounts={statusCounts}
        onFilterChange={setSelectedStatus}
      />

      {children}

      <LibraryAppSections sections={filteredSections} />
    </>
  );
}
