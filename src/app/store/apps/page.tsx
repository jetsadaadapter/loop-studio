"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { AppCategoryRanking } from "@/components/app-category-ranking";
import { IntegrationShowcase } from "@/components/integration-showcase";
import { TopbarSearch } from "@/components/topbar-search";
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu";
import { AppTile } from "@/components/app-tile";
import {
  storeAppsResponse,
  mainTabs,
  statusFilters,
  footerLinks,
  type MainTabKey,
  type StatusFilterKey,
} from "./data";

export default function StoreAppsPage() {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabKey>("tool");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilterKey>("production ready");
  const [searchQuery, setSearchQuery] = useState("");
  const { sections } = storeAppsResponse;

  const baseSections = useMemo(() => {
    if (selectedMainTab === "marketplace-updates") return sections;
    if (selectedMainTab === "admin")
      return sections.filter((s) => s.id === "platform");
    return sections.filter((s) => s.id === selectedMainTab);
  }, [sections, selectedMainTab]);

  const searchedSections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

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
  }, [baseSections, searchQuery]);

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
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 w-full items-center gap-3 px-4 md:px-6">
          <Image
            src="/images/logo/logo-black-110x30.png"
            alt="Adapter Digital Group"
            width={120}
            height={36}
            className="h-7 w-auto"
            unoptimized
            priority
          />
          <div className="ml-auto flex items-center gap-2">
            <TopbarSearch value={searchQuery} onChange={setSearchQuery} />
            <ProfileAvatarMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 md:px-6">
        <section className="border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {mainTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedMainTab(tab.key);
                  setSelectedStatus("all");
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  selectedMainTab === tab.key
                    ? "bg-brand/10 text-brand"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {visibleStatusFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setSelectedStatus(filter.key)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  effectiveStatus === filter.key
                    ? "border-brand/30 bg-brand/10 text-brand"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter.label} ({statusCounts[filter.key]})
              </button>
            ))}
          </div>
        </section>

        <HeroBannerSlider />
        <AppCategoryRanking />
        <IntegrationShowcase />

        <section className="mt-8 space-y-6">
          {filteredSections.map((section) => (
            <div
              key={section.id}
              className="rounded-3xl border border-slate-200 bg-linear-to-b from-slate-50 to-white px-4 py-5 sm:px-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  {section.title}
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium text-brand hover:text-brand"
                >
                  See more
                </button>
              </div>
              <div className="-mx-1 flex snap-x gap-2 overflow-x-auto pb-1">
                {section.items.map((app) => (
                  <div key={app.id} className="snap-start">
                    <AppTile app={app} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center sm:px-6">
              <p className="text-sm font-medium text-slate-700">
                No apps match this filter.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try switching status or category.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Image
                src="/images/logo/logo-black-110x30.png"
                alt="Adapter Digital Group"
                width={110}
                height={30}
                className="h-6 w-auto"
                unoptimized
              />
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                The app marketplace for Adapter&apos;s ecosystem — MCPs,
                Platforms &amp; Tools built for modern marketing teams.
              </p>
            </div>

            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                  {heading}
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-slate-500">
                  {links.map((item) => (
                    <li key={item}>
                      <a href="#" className="transition hover:text-slate-900">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Adapter Digital Group. All
              rights reserved.
            </p>
            <div className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-brand" />
              <span className="text-xs font-medium text-slate-500">
                Adapter App Store
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
