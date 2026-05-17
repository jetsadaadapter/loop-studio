"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppTile } from "@/components/app-tile";
import { badgeFilters, type LibrarySection } from "@/app/library/apps/data";
import styles from "./styles.module.css";

type LibraryAppSectionsProps = {
  sections: LibrarySection[];
};

export function LibraryAppSections({ sections }: LibraryAppSectionsProps) {
  const [visibleCards, setVisibleCards] = useState<Record<string, true>>({});
  const [sectionBadgeFilter, setSectionBadgeFilter] = useState<
    Record<string, string>
  >({});
  const cardElementsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const cardKeys = useMemo(
    () =>
      sections.flatMap((section) =>
        section.items.map((app) => `${section.id}:${app.id}`),
      ),
    [sections],
  );

  const revealDelayClasses = [
    styles.revealDelay0,
    styles.revealDelay1,
    styles.revealDelay2,
    styles.revealDelay3,
    styles.revealDelay4,
    styles.revealDelay5,
    styles.revealDelay6,
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleCards((previous) => {
          let changed = false;
          const next = { ...previous };

          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const key = entry.target.getAttribute("data-card-key");
            if (!key || next[key]) continue;
            next[key] = true;
            changed = true;
          }

          return changed ? next : previous;
        });
      },
      {
        threshold: 0.22,
        rootMargin: "0px 8% -6% 8%",
      },
    );

    for (const key of cardKeys) {
      const element = cardElementsRef.current[key];
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [cardKeys]);

  return (
    <section className="mt-8 space-y-6">
      {sections.map((section) => {
        const visibleBadgeFilters = badgeFilters.filter(
          (badgeFilter) =>
            badgeFilter.key === "all" ||
            section.items.some(
              (app) => app.badge?.toLowerCase() === badgeFilter.key,
            ),
        );
        const activeBadge = sectionBadgeFilter[section.id] ?? "all";
        const effectiveBadge = visibleBadgeFilters.some(
          (badgeFilter) => badgeFilter.key === activeBadge,
        )
          ? activeBadge
          : "all";

        const displayedItems =
          effectiveBadge === "all"
            ? section.items
            : section.items.filter(
              (app) => app.badge?.toLowerCase() === effectiveBadge,
            );

        return (
          <div key={section.id} className="px-1 py-1 sm:px-0">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {section.title}
              </h2>
              {section.items.length >= 8 ? (
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  See more
                </button>
              ) : null}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              {visibleBadgeFilters.map((badgeFilter) => (
                <button
                  key={badgeFilter.key}
                  type="button"
                  onClick={() =>
                    setSectionBadgeFilter((prev) => ({
                      ...prev,
                      [section.id]:
                        prev[section.id] === badgeFilter.key
                          ? "all"
                          : badgeFilter.key,
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all duration-200 ${effectiveBadge === badgeFilter.key
                      ? "border-brand bg-brand text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                    }`}
                >
                  {badgeFilter.label}
                </button>
              ))}
            </div>

            <div className="flex snap-x gap-3 overflow-x-auto px-1 py-2 sm:gap-4 sm:py-3">
              {displayedItems.map((app, index) => {
                const cardKey = `${section.id}:${app.id}`;
                const isVisible = Boolean(visibleCards[cardKey]);

                return (
                  <div
                    key={cardKey}
                    data-card-key={cardKey}
                    ref={(element) => {
                      cardElementsRef.current[cardKey] = element;
                    }}
                    className={`shrink-0 w-[86vw] sm:w-[44vw] md:w-[30vw] lg:w-[23%] xl:w-[22%] max-w-[280px] snap-start transition-all duration-500 ease-out ${isVisible
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-3 scale-[0.985] opacity-0"
                      } ${revealDelayClasses[Math.min(index, 6)]}`}
                  >
                    <AppTile app={app} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-white to-slate-50 px-6 py-12 text-center shadow-sm sm:px-8">
          <div className="mx-auto max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Library Status
            </p>
            <p className="mt-2 text-base font-semibold text-slate-800 sm:text-lg">
              ไม่พบแอปที่ตรงกับเงื่อนไขที่เลือก
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              กรุณาปรับสถานะหรือหมวดหมู่ใหม่
              เพื่อแสดงรายการแอปที่เกี่ยวข้องกับการใช้งานของทีม
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
