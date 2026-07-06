"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  startTransition,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TagToolbar } from "./tag-toolbar";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerFilterSidebar } from "@/components/manager-filter-sidebar";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { TagFormModal } from "./tag-form-modal";
import { TagTablePanel } from "./tag-table-panel";
import {
  getManageTags,
  createManageTag,
  updateManageTag,
  deleteManageTag,
} from "@/core/services/tags.service";
import type { ManageTagApiItem } from "@/core/interfaces/tags.interface";
import type { ManageTagFormValues } from "@/core/validators/tags.validator";
import { useToast } from "@/components/toast-provider";

const DEFAULT_PAGE_SIZE = 10;

interface ManageTagsClientProps {
  initialTags?: ManageTagApiItem[];
}

export function ManageTagsClient({ initialTags = [] }: ManageTagsClientProps) {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
  }, []);

  // ── Data state ──
  const [tags, setTags] = useState<ManageTagApiItem[]>(initialTags);
  const [isLoading, setIsLoading] = useState(initialTags.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(
    () => (initialTags.length > 0 ? new Date() : null),
  );

  // ── Filter / pagination state ──
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "newest">("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // ── Modal state ──
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<ManageTagApiItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<ManageTagApiItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load ──
  const loadTags = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError("");
    try {
      const data = await getManageTags();
      setTags(data);
      setLastUpdatedAt(new Date());
    } catch {
      setLoadError("Unable to load tags at this time.");
    } finally {
      if (options?.silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTags.length === 0) {
      startTransition(() => {
        void loadTags();
      });
    }
  }, [loadTags, initialTags.length]);

  // ── Filtered + sorted list ──
  const filtered = useMemo(() => {
    let base = tags.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (colorFilter === "has-color") {
      base = base.filter((t) => /^#[0-9A-Fa-f]{6}$/.test(t.color));
    } else if (colorFilter === "no-color") {
      base = base.filter((t) => !/^#[0-9A-Fa-f]{6}$/.test(t.color));
    }
    if (sortBy === "newest") {
      base = [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      base = [...base].sort((a, b) => a.name.localeCompare(b.name));
    }
    return base;
  }, [tags, search, colorFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedTags = filtered.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const hasActiveFilter = search !== "" || colorFilter !== "all" || sortBy !== "name-asc";

  function clearFilters() {
    setSearch("");
    setColorFilter("all");
    setSortBy("name-asc");
    setCurrentPage(1);
  }

  // ── Handlers ──
  function openCreate() {
    setEditTarget(null);
    setSubmitError("");
    setModalMode("create");
  }

  function openEdit(tag: ManageTagApiItem) {
    setEditTarget(tag);
    setSubmitError("");
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    setSubmitError("");
  }

  async function handleSubmit(values: ManageTagFormValues) {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (modalMode === "create") {
        const created = await createManageTag(values);
        setTags((prev) => [created, ...prev]);
        pushToast(`"${created.name}" created successfully.`, "success");
      } else if (modalMode === "edit" && editTarget) {
        const updated = await updateManageTag(editTarget.id, values);
        setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        pushToast(`"${updated.name}" saved successfully.`, "success");
      }
      closeModal();
    } catch {
      setSubmitError(
        modalMode === "create" ? "Failed to create tag." : "Failed to update tag.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(tag: ManageTagApiItem) {
    setDeletingId(tag.id);
    const previous = tags;
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    setDeleteTarget(null);
    try {
      await deleteManageTag(tag.id);
      pushToast(`"${tag.name}" deleted successfully.`, "success");
    } catch {
      setTags(previous);
      pushToast("Failed to delete tag.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const colorFilterOptions = [
    { value: "all", label: "All" },
    { value: "has-color", label: "Has Color" },
    { value: "no-color", label: "No Color" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle} actions={null}>
      <div className="overflow-hidden rounded-2xl border bg-card lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Desktop sidebar filter */}
        <aside className="hidden border-r bg-muted/20 p-5 lg:block">
          <ManagerFilterSidebar
            sections={[
              {
                key: "color",
                title: "Filter By Color",
                value: colorFilter,
                options: colorFilterOptions,
                onChange: (val) => { setColorFilter(val); setCurrentPage(1); },
              },
            ]}
            onReset={clearFilters}
            resetDisabled={!hasActiveFilter}
          />
        </aside>

        {/* Main content panel */}
        <div className="space-y-4 p-5 lg:p-6">
          {/* Toolbar */}
          <TagToolbar
            search={search}
            sortBy={sortBy}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isDeletingActive={deletingId !== null}
            lastUpdatedAt={lastUpdatedAt}
            onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
            onSortChange={(val) => { setSortBy(val); setCurrentPage(1); }}
            onRefresh={() => loadTags({ silent: true })}
            onCreate={openCreate}
            onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
          />

          {/* Table + Pagination */}
          <TagTablePanel
            isLoading={isLoading}
            loadError={loadError}
            tags={tags}
            filtered={filtered}
            pagedTags={pagedTags}
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            hasActiveFilter={hasActiveFilter}
            onRetry={() => loadTags()}
            onCreateFirst={openCreate}
            onClearFilters={clearFilters}
            onEdit={openEdit}
            onDelete={(t) => setDeleteTarget(t)}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-[320px] overflow-y-auto">
          <SheetHeader className="px-4 pb-3 pt-5">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              Filters
            </SheetTitle>
            <SheetDescription>
              Narrow down tag list by color status.
            </SheetDescription>
          </SheetHeader>
          <div className="px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
            <ManagerFilterSidebar
              sections={[
                {
                  key: "color",
                  title: "Filter By Color",
                  value: colorFilter,
                  options: colorFilterOptions,
                  onChange: (val) => { setColorFilter(val); setCurrentPage(1); },
                },
              ]}
              onReset={clearFilters}
              resetDisabled={!hasActiveFilter}
              className="px-1"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Create / Edit modal */}
      {modalMode && (
        <TagFormModal
          mode={modalMode}
          initialValues={editTarget ?? undefined}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ManagerDeleteConfirm
          itemTypeLabel="tag"
          itemName={deleteTarget.name}
          itemId={deleteTarget.id}
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </ManagerShell>
  );
}
