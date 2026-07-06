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
import { SlidersHorizontal } from "lucide-react";
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageCreateButton } from "@/components/ui/manage-create-button";
import { ManageFilterSelect } from "@/components/ui/manage-filter-select";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerFilterSidebar } from "@/components/manager-filter-sidebar";
import { ManagerPagination } from "@/components/manager-pagination";
import AppBannerCard from "@/components/app-banner-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  getManageBanners,
  deleteManageBanner,
} from "@/core/services/banners.service";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { useToast } from "@/components/toast-provider";
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
      item.app?.category !== null && typeof item.app?.category === "object"
        ? item.app.category.name
        : (typeof item.app?.category === "string" ? item.app.category : ""),
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

export function ManageBannersClient() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<BannerRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError] = useState<string>("");

  async function handleDeleteBanner(target: BannerRecord) {
    setDeletingId(target.id);
    const previous = banners;
    setBanners((current) => current.filter((item) => item.id !== target.id));
    setDeleteTarget(null);
    try {
      await deleteManageBanner(target.id);
      pushToast(`"${target.title}" deleted successfully.`, "success");
    } catch {
      setBanners(previous);
      pushToast("Failed to delete banner.", "error");
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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

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
        page: currentPage,
        limit: pageSize,
      });
      setBanners((response.data ?? []).map(mapApiItemToRecord));
      if (response.meta) {
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } else {
        setTotal(response.data.length);
        setTotalPages(Math.max(1, Math.ceil(response.data.length / pageSize)));
      }
      setLastUpdatedAt(new Date());
    } catch {
      setLoadError("Failed to load banners.");
    } finally {
      if (silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [currentPage, pageSize]);

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

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedBanners = filtered;

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
    setSearch(value);
    setCurrentPage(1);
  }

  return (
    <ManagerShell
      title={pageTitle}
      description={pageSubtitle}
      actions={null}
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
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:gap-4 xl:flex-row xl:items-center xl:justify-between select-none">
            {/* Left side actions and search */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-3 flex-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden shrink-0 size-8 border-slate-200 bg-white"
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <SlidersHorizontal className="size-4" />
              </Button>

              <ManageSearchInput value={searchInput} onChange={onSearchChange} placeholder="Search banner title, app, or category" />
              <ManageFilterSelect
                label="Sort By"
                value={sortBy}
                options={[
                  { value: "sort-asc", label: "Sort: Low-High" },
                  { value: "newest", label: "Newest" },
                  { value: "title-asc", label: "Title: A-Z" },
                  { value: "title-desc", label: "Title: Z-A" },
                ]}
                onChange={onSortChange}
              />
            </div>
            <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
              <ManageRefreshButton lastUpdatedAt={lastUpdatedAt} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={() => void loadBanners({ silent: true })} title="Refresh Banners" />
              <ManageCreateButton onClick={() => router.push("/manage/banners/create")} disabled={deletingId !== null}>Create Banner</ManageCreateButton>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: pageSize }).map((_, index) => (
                <div
                  key={`skeleton-card-${index}`}
                  className="w-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-zinc-100 overflow-hidden flex flex-col"
                >
                  {/* Image Skeleton */}
                  <div className="p-2 pb-0 shrink-0">
                    <div className="w-full aspect-[16/10] bg-zinc-100 rounded-xl animate-pulse" />
                  </div>

                  {/* Content Skeleton */}
                  <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                    {/* App header row Skeleton */}
                    <div className="mb-2 flex items-center gap-2">
                      <div className="size-6 rounded-full bg-zinc-100 animate-pulse shrink-0" />
                      <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                    </div>

                    {/* Title + Subtitle Skeleton */}
                    <div className="mb-3 space-y-1.5">
                      <div className="h-3 w-full bg-zinc-50 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-zinc-50 rounded animate-pulse" />
                    </div>

                    {/* Badges Skeleton */}
                    <div className="mt-auto flex flex-wrap items-center gap-1.5">
                      <div className="h-5 w-24 rounded-full bg-zinc-100 animate-pulse" />
                      <div className="h-5 w-16 rounded-full bg-zinc-100 animate-pulse" />
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
                  <AppBannerCard
                    key={row.id}
                    banner={{
                      id: row.id,
                      title: row.title,
                      subtitle: row.subtitle,
                      imageId: row.imageId,
                      isActive: row.isActive,
                      sortOrder: row.sortOrder,
                      startsAt: row.startsAt,
                      endsAt: row.endsAt,
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
                ))}
              </div>

              <ManagerPagination
                currentPage={safeCurrentPage}
                pageSize={pageSize}
                totalItems={total}
                onPageChange={onPaginationChange}
                onPageSizeChange={onPageSizeChange}
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
          itemTypeLabel="banner"
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
