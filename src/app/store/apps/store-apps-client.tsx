"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { StoreFilterToolbar } from "@/components/store-filter-toolbar";
import { StoreAppSections } from "@/components/store-app-sections";
import { useStoreShell } from "@/app/store/store-shell";
import {
  mainTabs,
  statusFilters,
  type StoreSection,
  type MainTabKey,
  type StatusFilterKey,
} from "./data";

type StoreAppsClientProps = {
  sections: StoreSection[];
  children?: ReactNode;
};

export function StoreAppsClient({ sections, children }: StoreAppsClientProps) {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabKey>("tool");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilterKey>("production ready");
  const { searchQuery } = useStoreShell();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const baseSections = useMemo(() => {
    return sections.filter((s) => s.id === selectedMainTab);
  }, [sections, selectedMainTab]);

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

  const effectiveStatus: StatusFilterKey = visibleStatusFilters.some(
    (f) => f.key === selectedStatus,
  )
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
      <StoreFilterToolbar
        tabs={mainTabs}
        selectedTab={selectedMainTab}
        onTabChange={(tabKey) => {
          setSelectedMainTab(tabKey);
          setSelectedStatus("all");
        }}
        filters={visibleStatusFilters}
        selectedFilter={effectiveStatus}
        filterCounts={statusCounts}
        onFilterChange={setSelectedStatus}
      />

      {children}

      <StoreAppSections sections={filteredSections} />
    </>
  );
}
