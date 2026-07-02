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
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageCreateButton } from "@/components/ui/manage-create-button";
import { ManageFilterSelect } from "@/components/ui/manage-filter-select";
import { Button } from "@/components/ui/button";
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
          <ManageSearchInput value={search} onChange={setSearch} placeholder="Search categories..." />
          <div className="flex items-center gap-3 w-full xl:w-auto">
            <ManageFilterSelect label="Sort" value={sortBy} options={[{ value: "name-asc", label: "Name A–Z" }, { value: "newest", label: "Newest" }]} onChange={(v) => setSortBy(v as typeof sortBy)} width="xl:w-36" />
            {hasActiveFilter && (
              <Button type="button" variant="ghost" size="icon" onClick={() => { setSearch(""); setSortBy("name-asc"); }} className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0" title="Reset Filters">
                <SlidersHorizontal className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
          <ManageRefreshButton lastUpdatedAt={lastUpdatedAt} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={() => void loadCategories({ silent: true })} title="Refresh Categories" />
          <ManageCreateButton onClick={openCreate}>Create Category</ManageCreateButton>
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
