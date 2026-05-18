"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerFilterSidebar } from "@/components/manager-filter-sidebar";
import { ManagerPagination } from "@/components/manager-pagination";
import AppBannerCard from "@/components/app-banner-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getManageBanners,
  deleteManageBanner,
} from "@/core/services/banners.service";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import type {
  GetBannersResponse,
  LibraryBannerItem,
} from "@/core/interfaces/banners.interface";

type BannerRecord = {
  id: string;
  title: string;
  subtitle: string;
  appName: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  imageId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  instructions: string;
  ctaLabel: string;
  badgeLabel?: string | null;
  tags: string[];
  iconId?: string | null;
};

function mapApiItemToRecord(item: LibraryBannerItem): BannerRecord {
  return {
    id: item.id || item.bannerId || "",
    title: item.title,
    subtitle: item.subtitle,
    appName: item.app?.name || "",
    category:
      typeof item.app?.category === "object"
        ? item.app.category.name
        : item.app?.category || "",
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    updatedAt: (item.updatedAt || "").slice(0, 10),
    imageId: item.imageId,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    instructions: item.app?.instructions || "",
    ctaLabel: item.app?.ctaLabel || "Get Started",
    badgeLabel: item.app?.badgeLabel || null,
    iconId: item.app?.iconId || null,
    tags: item.app?.tags?.map((t: string | { name: string }) => typeof t === "string" ? t : t.name) || [],
  };
}

const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

export function ManageBannersClient() {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<BannerRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");

  async function handleDeleteBanner(target: BannerRecord) {
    setDeletingId(target.id);
    const previous = banners;
    setBanners((current) => current.filter((item) => item.id !== target.id));
    setDeleteTarget(null);
    try {
      await deleteManageBanner(target.id);
      // Success toast could be added here
    } catch {
      setBanners(previous);
      setDeleteError("เกิดข้อผิดพลาดในการลบแบนเนอร์");
    } finally {
      setDeletingId(null);
    }
  }
  const [banners, setBanners] = useState<BannerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sort-asc");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState("");
  const [mockDates, setMockDates] = useState<{ startsAt: string, endsAt: string } | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

  const toggleMockDates = () => {
    if (!mockDates) {
      const now = Date.now();
      setMockDates({
        startsAt: new Date(now).toISOString(),
        endsAt: new Date(now + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
      });
    } else {
      setMockDates(null);
    }
  };

  const clearSearchDebounce = useCallback(() => {
    if (searchDebounceRef.current !== null) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearSearchDebounce();
  }, [clearSearchDebounce]);

  const loadBanners = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError("");
    try {
      const response: GetBannersResponse = await getManageBanners({
        page: 1,
        limit: 100,
      });
      setBanners((response.data ?? []).map(mapApiItemToRecord));
      setLastUpdatedAt(new Date());
    } catch {
      setLoadError("Failed to load banners.");
    } finally {
      if (silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadBanners();
    });
  }, [loadBanners]);

  const filtered = useMemo(() => {
    let base = banners.filter((item) =>
      `${item.title} ${item.appName} ${item.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    if (categoryFilter !== "all")
      base = base.filter((item) => item.category === categoryFilter);
    if (statusFilter !== "all")
      base = base.filter((item) =>
        statusFilter === "active" ? item.isActive : !item.isActive,
      );
    const sorted = [...base];
    switch (sortBy) {
      case "newest":
        sorted.sort((l, r) => r.updatedAt.localeCompare(l.updatedAt));
        break;
      case "title-asc":
        sorted.sort((l, r) => l.title.localeCompare(r.title));
        break;
      case "sort-asc":
      default:
        sorted.sort((l, r) => l.sortOrder - r.sortOrder);
        break;
    }
    return sorted;
  }, [banners, search, categoryFilter, statusFilter, sortBy]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pagedBanners = useMemo(() => {
    return filtered.slice(pageStart, pageStart + pageSize);
  }, [filtered, pageSize, pageStart]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, -1, totalPages);
      } else if (safeCurrentPage >= totalPages - 2) {
        pages.push(
          1,
          -1,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          -1,
          safeCurrentPage - 1,
          safeCurrentPage,
          safeCurrentPage + 1,
          -1,
          totalPages,
        );
      }
    }
    return pages.filter((v, i, arr) => v !== arr[i - 1]);
  }, [safeCurrentPage, totalPages]);

  const start = total === 0 ? 0 : pageStart + 1;
  const end = Math.min(pageStart + pageSize, total);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(banners.map((item) => item.category).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return [
      { value: "all", label: "All" },
      ...categories.map((value) => ({ value, label: value })),
    ];
  }, [banners]);

  // Filter options
  const statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];
  const hasActiveFilter =
    categoryFilter !== "all" || statusFilter !== "all" || !!search;
  function clearFilters() {
    setCategoryFilter("all");
    setStatusFilter("all");
    setSearch("");
    setSearchInput("");
    setCurrentPage(1);
    clearSearchDebounce();
  }
  function onSortChange(value: string) {
    setSortBy(value);
    setCurrentPage(1);
  }
  function onPageSizeChange(value: number) {
    setPageSize(value);
    setCurrentPage(1);
  }
  function onCategoryFilterChange(value: string) {
    setCategoryFilter(value);
    setCurrentPage(1);
  }
  function onStatusFilterChange(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
  }
  function onPaginationChange(page: number) {
    setCurrentPage(page);
  }
  function onSearchChange(value: string) {
    setSearchInput(value);
    clearSearchDebounce();

    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 300);
  }

  return (
    <ManagerShell
      title={pageTitle}
      description={pageSubtitle}
      actions={
        <Button
          type="button"
          disabled={deletingId !== null}
          onClick={() => router.push("/manage/banners/create")}
        >
          Create Banner
        </Button>
      }
    >
      <div className="overflow-hidden rounded-2xl border bg-card lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-muted/20 p-5 lg:block">
          <ManagerFilterSidebar
            sections={[
              {
                key: "category",
                title: "Filter By Category",
                value: categoryFilter,
                options: categoryOptions,
                onChange: onCategoryFilterChange,
              },
              {
                key: "status",
                title: "By Status",
                value: statusFilter,
                options: statusOptions,
                onChange: onStatusFilterChange,
              },
            ]}
            onReset={clearFilters}
            resetDisabled={!hasActiveFilter}
          />
        </aside>

        <div className="space-y-4 p-5 lg:p-6">
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <SlidersHorizontal className="size-4" />
              </Button>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Filters
                </p>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} items found
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:items-center xl:justify-end">
              <div className="relative w-full sm:col-span-2 xl:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search banner title, app, or category"
                  className="bg-background pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-brand/30 bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand xl:w-auto"
                disabled={isLoading || isRefreshing}
                onClick={() => loadBanners({ silent: true })}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                type="button"
                variant={mockDates ? "default" : "outline"}
                className="w-full xl:w-auto hidden"
                onClick={toggleMockDates}
              >
                Mock Dates: {mockDates ? "ON" : "OFF"}
              </Button>
              <Select
                value={sortBy}
                onValueChange={(v) => v && onSortChange(v)}
              >
                <SelectTrigger className="w-full xl:w-40">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sort-asc">Sort: Low-High</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="title-asc">Title: A-Z</SelectItem>
                  <SelectItem value="title-desc">Title: Z-A</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => v && onPageSizeChange(Number(v))}
              >
                <SelectTrigger className="w-full xl:w-32">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((sizeOption) => (
                    <SelectItem key={sizeOption} value={String(sizeOption)}>
                      {sizeOption} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {lastUpdatedAt
              ? `Updated ${lastUpdatedAt.toLocaleDateString()} ${lastUpdatedAt.toLocaleTimeString()}`
              : "Not updated yet"}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: pageSize }).map((_, index) => (
                <div
                  key={`skeleton-card-${index}`}
                  className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-zinc-100 overflow-hidden flex flex-col"
                >
                  {/* Header Skeleton */}
                  <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-zinc-100 animate-pulse" />
                      <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Text Skeleton */}
                  <div className="px-4 pb-3 space-y-2">
                    <div className="h-3 w-full bg-zinc-50 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-zinc-50 rounded animate-pulse" />
                  </div>

                  {/* Image Skeleton */}
                  <div className="px-4">
                    <div className="w-full aspect-[16/10] bg-zinc-100 rounded-xl animate-pulse" />
                  </div>

                  {/* Lines Skeleton */}
                  <div className="mt-6 border-t border-zinc-100">
                    <div className="flex justify-between px-4 py-3 border-b border-zinc-100">
                      <div className="h-3 w-16 bg-zinc-50 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between px-4 py-3 border-b border-zinc-100">
                      <div className="h-3 w-12 bg-zinc-50 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-zinc-100 rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <div className="h-3 w-14 bg-zinc-50 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pagedBanners.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-12 text-center">
              <p className="max-w-lg text-sm text-muted-foreground">
                {loadError
                  ? "Unable to load banners right now."
                  : banners.length === 0
                    ? "No banners yet. Create your first banner to start managing content."
                    : "No results for the current search or filters."}
              </p>
              <div className="flex gap-2">
                {loadError ? (
                  <Button type="button" size="sm" onClick={() => loadBanners()}>
                    Retry
                  </Button>
                ) : banners.length === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={deletingId !== null}
                    onClick={() => router.push("/manage/banners/create")}
                  >
                    Create Banner
                  </Button>
                ) : hasActiveFilter ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pagedBanners.map((row) => (
                  <div key={row.id} className="flex flex-col gap-3">
                    <AppBannerCard
                      banner={{
                        id: row.id,
                        title: row.title,
                        subtitle: row.subtitle,
                        imageId: row.imageId,
                        startsAt: mockDates ? mockDates.startsAt : row.startsAt,
                        endsAt: mockDates ? mockDates.endsAt : row.endsAt,
                        app: {
                          name: row.appName,
                          category: { name: row.category },
                          tags: row.tags,
                          instructions: row.instructions,
                          ctaLabel: row.ctaLabel,
                          badgeLabel: row.badgeLabel,
                          iconId: row.iconId,
                        },
                      }}
                      onEdit={() => router.push(`/manage/banners/${row.id}/edit`)}
                      onDelete={() => setDeleteTarget(row)}
                    />
                    {!row.isActive && (
                      <div className="px-2 flex justify-start">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium border border-border">
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <ManagerPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                pageNumbers={pageNumbers}
                start={start}
                end={end}
                total={total}
                onPageChange={onPaginationChange}
              />
            </>
          )}
        </div>
      </div>

      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="left"
          className="w-[88vw] max-w-[320px] overflow-y-auto"
        >
          <SheetHeader className="px-4 pb-3 pt-5">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              Filters
            </SheetTitle>
            <SheetDescription>
              Narrow down banner list by category and status.
            </SheetDescription>
          </SheetHeader>
          <div className="px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
            <ManagerFilterSidebar
              sections={[
                {
                  key: "category",
                  title: "Filter By Category",
                  value: categoryFilter,
                  options: categoryOptions,
                  onChange: onCategoryFilterChange,
                },
                {
                  key: "status",
                  title: "By Status",
                  value: statusFilter,
                  options: statusOptions,
                  onChange: onStatusFilterChange,
                },
              ]}
              onReset={clearFilters}
              resetDisabled={!hasActiveFilter}
              className="px-1"
            />
          </div>
        </SheetContent>
      </Sheet>

      {deleteTarget ? (
        <ManagerDeleteConfirm
          itemName={deleteTarget.title}
          itemId={deleteTarget.id}
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteBanner(deleteTarget)}
        />
      ) : null}

      {deleteError && (
        <div className="text-red-500 text-sm mt-2">{deleteError}</div>
      )}
    </ManagerShell>
  );
}
