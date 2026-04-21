"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  StorePageBlocks,
  STORE_BLOCK_PRESETS,
} from "@/components/store-page-blocks";
import { StoreFilterToolbar } from "@/components/store-filter-toolbar";
import { StoreAppSections } from "@/components/store-app-sections";
import { useStoreShell } from "@/app/store/store-shell";
import {
  storeAppsResponse,
  mainTabs,
  statusFilters,
  type MainTabKey,
  type StatusFilterKey,
} from "./data";

export default function StoreAppsPage() {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabKey>("tool");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilterKey>("production ready");
  const { searchQuery } = useStoreShell();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const { sections } = storeAppsResponse;

  const baseSections = useMemo(() => {
    if (selectedMainTab === "marketplace-updates") return sections;
    if (selectedMainTab === "admin")
      return sections.filter((s) => s.id === "platform");
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

      <StorePageBlocks blocks={STORE_BLOCK_PRESETS.marketplace} />

      <StoreAppSections sections={filteredSections} />
    </>
  );
}
