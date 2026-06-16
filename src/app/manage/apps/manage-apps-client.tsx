"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import { Search, SlidersHorizontal, RotateCw, Plus } from "lucide-react";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { ManagerFilterSidebar } from "@/components/manager-filter-sidebar";
import { ManagerPagination } from "@/components/manager-pagination";
import { ManagerAppCard } from "@/components/manager-app-card";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import {
  getAppItemId,
  type AppLinkType,
  type ManageAppApiItem,
} from "@/core/interfaces/apps.interface";
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
import { deleteManageApp, getManageApps } from "@/core/services/apps.service";
import {
  applyManageAppsListQuery,
  DEFAULT_PAGE_SIZE,
  parseManageAppsListQuery,
  type SortValue,
  type StatusFilterValue,
  type TypeFilterValue,
} from "@/core/services/manage-apps-list-query";

type AppRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageId: string;
  iconId: string;
  instructions: string;
  integration: string;
  ctaLabel: string;
  ctaLink: string;
  linkType: AppLinkType;
  isActive: boolean;
  sortOrder: number;
  badgeLabel: string;
  tags: string[];
  updatedAt: string;
  imageUrl?: string;
};

function resolveManageAppImageUrl(
  item: Pick<ManageAppApiItem, "imageId" | "imageUrl">,
): string | undefined {
  if (item.imageUrl && item.imageUrl.trim()) return item.imageUrl;
  if (item.imageId && item.imageId.trim()) {
    return `/images/${encodeURIComponent(item.imageId.trim())}`;
  }
  return undefined;
}

function mapApiItemToRecord(item: ManageAppApiItem): AppRecord {
  return {
    id: getAppItemId(item),
    name: item.name,
    category:
      typeof item.category === "object"
        ? item.category.name
        : (item.category ?? ""),
    description: item.description,
    imageId: item.imageId,
    iconId: item.iconId,
    instructions: item.instructions,
    integration: item.integration ?? "",
    ctaLabel: item.ctaLabel ?? "",
    ctaLink: item.ctaLink ?? "",
    linkType: item.linkType,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    badgeLabel: item.badgeLabel ?? "",
    tags: (item.tags ?? [])
      .map((tag) => tag.id || tag.tagId || "")
      .filter(Boolean),
    updatedAt: (item.updatedAt || "").slice(0, 10),
    imageUrl: resolveManageAppImageUrl(item),
  };
}



export function ManageAppsClient() {
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const listQuery = useMemo(
    () => parseManageAppsListQuery(searchParams),
    [searchParams],
  );
  const search = listQuery.q;
  const [searchInput, setSearchInput] = useState(search);

  // Sync searchInput when URL search changes (e.g. back button or clear filters)
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  const categoryFilter = listQuery.category;
  const statusFilter = listQuery.status;
  const typeFilter = listQuery.type;
  const sortBy = listQuery.sort;
  const pageSize = listQuery.size;
  const currentPage = listQuery.page;
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadApps = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setLoadError("");
      try {
        const response = await getManageApps({ page: currentPage, limit: pageSize });
        setApps((response.data ?? []).map(mapApiItemToRecord));
        if (response.meta) {
          setTotal(response.meta.total);
          setTotalPages(response.meta.totalPages);
        } else {
          setTotal(response.data.length);
          setTotalPages(Math.max(1, Math.ceil(response.data.length / pageSize)));
        }
        setLastUpdatedAt(new Date());
      } catch {
        setLoadError("Failed to load apps.");
        pushToast("Failed to load apps.", "error");
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [pushToast, currentPage, pageSize],
  );

  useEffect(() => {
    startTransition(() => {
      void loadApps();
    });
  }, [loadApps]);

  const filtered = useMemo(() => {
    const base = apps
      .filter((item) =>
        `${item.name} ${item.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .filter(
        (item) => categoryFilter === "all" || item.category === categoryFilter,
      )
      .filter((item) => {
        if (statusFilter === "all") return true;
        return statusFilter === "active" ? item.isActive : !item.isActive;
      })
      .filter((item) => typeFilter === "all" || item.linkType === typeFilter);

    const sorted = [...base];
    switch (sortBy) {
      case "newest":
        sorted.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        );
        break;
      case "name-asc":
        sorted.sort((left, right) => left.name.localeCompare(right.name));
        break;
      case "name-desc":
        sorted.sort((left, right) => right.name.localeCompare(left.name));
        break;
      case "sort-asc":
      default:
        sorted.sort((left, right) => left.sortOrder - right.sortOrder);
        break;
    }

    return sorted;
  }, [apps, search, categoryFilter, statusFilter, typeFilter, sortBy]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedApps = filtered;

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(apps.map((item) => item.category).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));

    return [
      { value: "all", label: "All" },
      ...categories.map((value) => ({ value, label: value })),
    ];
  }, [apps]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    [],
  );

  const typeOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "instruction", label: "Instruction" },
      { value: "internal", label: "Internal" },
      { value: "external", label: "External" },
    ],
    [],
  );

  const filterSections = [
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
    {
      key: "type",
      title: "By Type",
      value: typeFilter,
      options: typeOptions,
      onChange: (value: string) =>
        onTypeFilterChange(value as "all" | AppLinkType),
    },
  ];

  const hasActiveFilter =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    typeFilter !== "all";

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(
    () => getLocalizedText(routeMeta.title),
    [routeMeta],
  );
  const pageSubtitle = useMemo(
    () => getLocalizedText(routeMeta.subtitle),
    [routeMeta],
  );

  const clearSearchDebounce = useCallback(() => {
    if (searchDebounceRef.current !== null) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearSearchDebounce();
    };
  }, [clearSearchDebounce]);

  const syncListQuery = useCallback(
    (next: {
      q?: string;
      category?: string;
      status?: StatusFilterValue;
      type?: TypeFilterValue;
      sort?: SortValue;
      size?: number;
      page?: number;
    }) => {
      const values = {
        q: next.q ?? search,
        category: next.category ?? categoryFilter,
        status: next.status ?? statusFilter,
        type: next.type ?? typeFilter,
        sort: next.sort ?? sortBy,
        size: next.size ?? pageSize,
        page: next.page ?? currentPage,
      };

      const params = applyManageAppsListQuery(
        new URLSearchParams(searchParams.toString()),
        {
          q: values.q,
          category: values.category,
          status: values.status,
          type: values.type,
          sort: values.sort,
          size: values.size,
          page: values.page,
        },
      );

      const query = params.toString();
      if (query === searchParams.toString()) return;
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [
      categoryFilter,
      currentPage,
      pageSize,
      pathname,
      router,
      search,
      searchParams,
      sortBy,
      statusFilter,
      typeFilter,
    ],
  );

  function openCreateForm() {
    router.push("/manage/apps/create");
  }

  function clearFilters() {
    clearSearchDebounce();
    setSearchInput("");
    syncListQuery({
      q: "",
      category: "all",
      status: "all",
      type: "all",
      sort: "sort-asc",
      size: DEFAULT_PAGE_SIZE,
      page: 1,
    });
  }

  function onSearchChange(value: string) {
    setSearchInput(value);
    syncListQuery({ q: value, page: 1 });
  }

  function onCategoryFilterChange(value: string) {
    clearSearchDebounce();
    syncListQuery({ category: value, page: 1 });
  }

  function onStatusFilterChange(value: string) {
    if (value !== "all" && value !== "active" && value !== "inactive") {
      return;
    }

    clearSearchDebounce();
    syncListQuery({ status: value, page: 1 });
  }

  function onTypeFilterChange(value: TypeFilterValue) {
    clearSearchDebounce();
    syncListQuery({ type: value, page: 1 });
  }

  function onSortChange(
    value: "newest" | "name-asc" | "name-desc" | "sort-asc",
  ) {
    clearSearchDebounce();
    syncListQuery({ sort: value, page: 1 });
  }

  function onPageSizeChange(value: number) {
    clearSearchDebounce();
    syncListQuery({ size: value, page: 1 });
  }

  function onPaginationChange(page: number) {
    clearSearchDebounce();
    syncListQuery({ page });
  }

  async function onDelete(target: AppRecord) {
    setDeletingId(target.id);
    const previous = apps;
    setApps((current) => current.filter((item) => item.id !== target.id));
    setDeleteTarget(null);

    try {
      await deleteManageApp(target.id);
      pushToast("App deleted successfully.", "success");
    } catch (deleteError) {
      setApps(previous);
      pushToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete app.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
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
            sections={filterSections}
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

              <div className="relative w-full xl:w-80 shrink-0">
                <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search app name or category"
                  className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-slate-400"
                />
              </div>

              {/* Sort selector adjacent to search */}
              <div className="flex items-center gap-2 flex-1 xl:flex-initial">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Sort By</span>
                <div className="flex-1 xl:w-40">
                  <Select
                    value={sortBy}
                    onValueChange={(value) => onSortChange(value as SortValue)}
                  >
                    <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sort-asc">Sort: Low-High</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="name-asc">Name: A-Z</SelectItem>
                      <SelectItem value="name-desc">Name: Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right side controls matching prompts style */}
            <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
              {/* Last updated timestamp and refresh button */}
              <div className="flex items-center gap-2">
                {lastUpdatedAt && (
                  <span className="text-[10px] font-medium text-slate-400">
                    อัพเดทเมื่อ {lastUpdatedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isLoading || isRefreshing}
                  onClick={() => void loadApps({ silent: true })}
                  className="size-8 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
                  title="Refresh Apps"
                >
                  <RotateCw className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
                </Button>
              </div>

              <Button
                type="button"
                disabled={deletingId !== null}
                onClick={openCreateForm}
                className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center"
              >
                <Plus className="size-4 shrink-0" />
                Create App
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: pageSize }).map((_, index) => (
                <div
                  key={`skeleton-card-${index}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="p-2 pb-0">
                    <div className="w-full aspect-[16/10] animate-pulse rounded-xl bg-muted" />
                  </div>
                  <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted/50" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-muted/50" />
                    <div className="mt-1 h-5 w-20 animate-pulse rounded-full bg-muted/70" />
                    <div className="mt-2 h-px w-full bg-slate-100" />
                    <div className="h-7 w-full animate-pulse rounded-lg bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : pagedApps.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-12 text-center">
              <p className="max-w-lg text-sm text-muted-foreground">
                {loadError
                  ? "Unable to load app catalog right now."
                  : apps.length === 0
                    ? "No apps yet. Create your first app to start managing catalog content."
                    : "No results for the current search or filters."}
              </p>
              <div className="flex gap-2">
                {loadError ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void loadApps()}
                  >
                    Retry
                  </Button>
                ) : apps.length === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={deletingId !== null}
                    onClick={openCreateForm}
                  >
                    Create App
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {pagedApps.map((row) => {
                  return (
                    <ManagerAppCard
                      key={row.id}
                      item={row}
                      isBusy={deletingId !== null}
                      isDeleting={deletingId === row.id}
                      onEdit={() => router.push(`/manage/apps/${row.id}/edit`)}
                      onDelete={() => setDeleteTarget(row)}
                      integration={row.integration}
                    />
                  );
                })}
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
              Narrow down app list by category, status, and link type.
            </SheetDescription>
          </SheetHeader>
          <div className="px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
            <ManagerFilterSidebar
              sections={filterSections}
              onReset={clearFilters}
              resetDisabled={!hasActiveFilter}
              className="px-1"
            />
          </div>
        </SheetContent>
      </Sheet>

      {deleteTarget ? (
        <ManagerDeleteConfirm
          itemTypeLabel="app"
          itemName={deleteTarget.name}
          itemId={deleteTarget.id}
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void onDelete(deleteTarget)}
        />
      ) : null}
    </ManagerShell>
  );
}
