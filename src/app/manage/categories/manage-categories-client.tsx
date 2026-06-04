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
import { Search, RotateCw, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { CategoryFormModal } from "./category-form-modal";
import { CategoryTable } from "./category-table";
import {
  getManageCategories,
  createManageCategory,
  updateManageCategory,
  deleteManageCategory,
} from "@/core/services/categories.service";
import type { CategoryInfo } from "@/core/interfaces/categories.interface";
import type { ManageCategoryFormValues } from "@/core/validators/categories.validator";
import { useToast } from "@/components/toast-provider";

interface ManageCategoriesClientProps {
  initialCategories?: CategoryInfo[];
}

export function ManageCategoriesClient({
  initialCategories = [],
}: ManageCategoriesClientProps) {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(
    () => getLocalizedText(routeMeta.title),
    [routeMeta],
  );
  const pageSubtitle = useMemo(
    () => getLocalizedText(routeMeta.subtitle),
    [routeMeta],
  );

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
  }, []);

  // Data state
  const [categories, setCategories] = useState<CategoryInfo[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(initialCategories.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Set lastUpdatedAt after mount if initialCategories exist
  useEffect(() => {
    if (initialCategories.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastUpdatedAt(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "newest">("name-asc");

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<CategoryInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<CategoryInfo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError("");
    try {
      const data = await getManageCategories();
      setCategories(data);
      setLastUpdatedAt(new Date());
    } catch {
      setLoadError("Unable to load categories at this time.");
    } finally {
      if (options?.silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCategories.length === 0) {
      startTransition(() => {
        void loadCategories();
      });
    }
  }, [loadCategories, initialCategories.length]);

  const filtered = useMemo(() => {
    let base = categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (sortBy === "newest") {
      base = [...base].sort((a, b) => {
        const dateA = a.createdAt ?? "";
        const dateB = b.createdAt ?? "";
        return dateB.localeCompare(dateA);
      });
    } else {
      base = [...base].sort((a, b) => a.name.localeCompare(b.name));
    }
    return base;
  }, [categories, search, sortBy]);

  function openCreate() {
    setEditTarget(null);
    setSubmitError("");
    setModalMode("create");
  }

  function openEdit(cat: CategoryInfo) {
    setEditTarget(cat);
    setSubmitError("");
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    setSubmitError("");
  }

  async function handleSubmit(values: ManageCategoryFormValues) {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (modalMode === "create") {
        const created = await createManageCategory(values);
        setCategories((prev) => [created, ...prev]);
        pushToast(`"${created.name}" created successfully.`, "success");
      } else if (modalMode === "edit" && editTarget) {
        const updated = await updateManageCategory(editTarget.id, values);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        pushToast(`"${updated.name}" saved successfully.`, "success");
      }
      closeModal();
    } catch {
      setSubmitError(
        modalMode === "create"
          ? "Failed to create category."
          : "Failed to update category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(cat: CategoryInfo) {
    setDeletingId(cat.id);
    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    setDeleteTarget(null);
    try {
      await deleteManageCategory(cat.id);
      pushToast(`"${cat.name}" deleted successfully.`, "success");
    } catch {
      setCategories(previous);
      pushToast("Failed to delete category.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const hasActiveFilter = search !== "" || sortBy !== "name-asc";

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle} actions={null}>
      {/* Search and Filters Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
        {/* Left Group */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full xl:w-80 shrink-0">
            <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
            <input
              id="categories-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-slate-400"
            />
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 flex-1 xl:flex-initial">
              <span className="text-xs font-semibold text-slate-500 shrink-0">
                Sort
              </span>
              <div className="flex-1 xl:w-36">
                <Select
                  value={sortBy}
                  onValueChange={(val) => val && setSortBy(val as typeof sortBy)}
                >
                  <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name A–Z</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Filter */}
            {hasActiveFilter && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setSortBy("name-asc");
                }}
                className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0"
                title="Reset Filters"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Group */}
        <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
          {/* Timestamp + Refresh */}
          <div className="flex items-center gap-2">
            {lastUpdatedAt && (
              <span className="text-[10px] font-medium text-slate-400">
                Updated at{" "}
                {lastUpdatedAt.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isLoading || isRefreshing}
              onClick={() => loadCategories({ silent: true })}
              className="size-8 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
              title="Refresh Categories"
            >
              <RotateCw
                className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`}
              />
            </Button>
          </div>

          <Button
            type="button"
            id="categories-create-btn"
            onClick={openCreate}
            className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center"
          >
            <Plus className="size-4 shrink-0" />
            Create Category
          </Button>
        </div>
      </div>

      {/* Category Table */}
      <CategoryTable
        categories={filtered}
        isLoading={isLoading}
        loadError={loadError}
        onRetry={() => loadCategories()}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        openCreate={openCreate}
      />

      {/* Modal */}
      {modalMode && (
        <CategoryFormModal
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
          itemTypeLabel="category"
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
