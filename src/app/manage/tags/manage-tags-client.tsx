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
import {
  Search,
  RotateCw,
  Plus,
  Edit3,
  Trash2,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { TagFormModal } from "./tag-form-modal";
import {
  getManageTags,
  createManageTag,
  updateManageTag,
  deleteManageTag,
} from "@/core/services/tags.service";
import type { ManageTagApiItem } from "@/core/interfaces/tags.interface";
import type { ManageTagFormValues } from "@/core/validators/tags.validator";
import { useToast } from "@/components/toast-provider";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function resolveColor(color: string): string | undefined {
  return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton (table row style)
// ─────────────────────────────────────────────────────────────────────────────

function TagTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={`skeleton-row-${i}`} className="animate-pulse">
          <td className="p-3 px-4 hidden xs:table-cell">
            <div className="h-4 w-4 bg-slate-100 rounded" />
          </td>
          <td className="p-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-slate-100 shrink-0" />
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="h-3.5 w-32 bg-slate-100 rounded" />
                <div className="h-2.5 w-16 bg-slate-100 rounded" />
                {/* Mobile-only attributes skeletons */}
                <div className="flex gap-1.5 mt-1.5 md:hidden">
                  <div className="h-3.5 w-12 bg-slate-100 rounded-sm" />
                  <div className="h-3.5 w-16 bg-slate-100 rounded-sm" />
                </div>
              </div>
            </div>
          </td>
          <td className="p-3 hidden md:table-cell">
            <div className="h-5.5 w-20 bg-slate-100 rounded-full" />
          </td>
          <td className="p-3 hidden md:table-cell">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </td>
          <td className="p-3 hidden md:table-cell">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </td>
          <td className="p-3 pr-4">
            <div className="flex justify-end pr-1">
              <div className="h-7 w-7 bg-slate-100 rounded-sm" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Client Component
// ─────────────────────────────────────────────────────────────────────────────

interface ManageTagsClientProps {
  initialTags?: ManageTagApiItem[];
}

export function ManageTagsClient({ initialTags = [] }: ManageTagsClientProps) {
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

  // ── Mount guard (prevents hydration mismatch on time-sensitive state) ──
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
  }, []);

  // ── Data state ──
  const [tags, setTags] = useState<ManageTagApiItem[]>(initialTags);
  const [isLoading, setIsLoading] = useState(initialTags.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  // Avoid hydration mismatch: only set lastUpdatedAt after mount
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Set lastUpdatedAt after mount if initialTags exist
  useEffect(() => {
    if (initialTags.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastUpdatedAt(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "newest">("name-asc");

  // ── Modal state ──
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<ManageTagApiItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<ManageTagApiItem | null>(
    null,
  );
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
    if (sortBy === "newest") {
      base = [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      base = [...base].sort((a, b) => a.name.localeCompare(b.name));
    }
    return base;
  }, [tags, search, sortBy]);

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
        modalMode === "create"
          ? "Failed to create tag."
          : "Failed to update tag.",
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

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

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
              id="tags-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
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
                  onValueChange={(val) =>
                    val && setSortBy(val as typeof sortBy)
                  }
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
              onClick={() => loadTags({ silent: true })}
              className="size-8 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
              title="Refresh Tags"
            >
              <RotateCw
                className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`}
              />
            </Button>
          </div>

          <Button
            type="button"
            id="tags-create-btn"
            onClick={openCreate}
            className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center"
          >
            <Plus className="size-4 shrink-0" />
            Create Tag
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="relative w-full overflow-x-auto border border-slate-200 rounded-sm bg-white shadow-3xs">
        <table className="w-full caption-bottom text-xs min-w-full md:min-w-2xl">
          <thead className="[&_tr]:border-b bg-slate-50/50">
            <tr className="border-b transition-colors hover:bg-transparent">
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 px-4 w-10 hidden xs:table-cell">
                #
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3">
                Tag Name
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-32 hidden md:table-cell">
                Color
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-36 hidden md:table-cell">
                Created
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-36 hidden md:table-cell">
                Updated
              </th>
              <th className="text-foreground h-10 text-right align-middle font-semibold whitespace-nowrap p-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <TagTableSkeletonRows />
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-slate-500">{loadError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTags()}
                      className="h-8 border-slate-200 cursor-pointer"
                    >
                      Retry
                    </Button>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center select-none">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-sm bg-slate-50 border border-slate-100 text-slate-400">
                      <Tag className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {tags.length === 0
                          ? "No tags yet"
                          : "No tags found"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tags.length === 0
                          ? "Click the button above to add your first tag"
                          : "Try changing your search query"}
                      </p>
                    </div>
                    {tags.length === 0 && (
                      <Button
                        type="button"
                        onClick={openCreate}
                        className="h-8 bg-brand hover:bg-brand/80 text-white text-xs font-semibold px-4.5 rounded-sm cursor-pointer"
                      >
                        Create First Tag
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tag, index) => {
                const tagColor = resolveColor(tag.color);
                return (
                  <tr
                    key={tag.id}
                    className="hover:bg-slate-50/50 transition-colors border-b last:border-0"
                  >
                    {/* # */}
                    <td className="p-3 px-4 align-middle whitespace-nowrap text-xs font-semibold text-slate-400 hidden xs:table-cell">
                      {index + 1}
                    </td>

                    {/* Name */}
                    <td className="p-3 align-middle min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/15 shadow-2xs"
                          style={{ backgroundColor: tagColor ?? "#cbd5e1" }}
                        >
                          <Tag className="size-4 text-white drop-shadow-xs" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-slate-800 tracking-tight block leading-tight">
                            {tag.name}
                          </span>
                          <span className="text-[10px] font-sans text-slate-400 block mt-0.5 leading-none">
                            #{tag.id.slice(0, 8)}
                          </span>
                          {/* Mobile-only inline attributes */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 md:hidden">
                            {tagColor ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[8px] font-bold border"
                                style={{
                                  backgroundColor: `${tagColor}18`,
                                  color: tagColor,
                                  borderColor: `${tagColor}30`,
                                }}
                              >
                                {tag.color.toUpperCase()}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-50 text-[8px] font-bold text-slate-400 border border-slate-200/60">
                                No color
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-sans">
                              Created: {formatDate(tag.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Color badge */}
                    <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
                      {tagColor ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                          style={{
                            backgroundColor: `${tagColor}18`,
                            color: tagColor,
                            borderColor: `${tagColor}30`,
                          }}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: tagColor }}
                          />
                          {tag.color.toUpperCase()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-200/60">
                          No color
                        </span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="p-3 align-middle whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
                      {formatDate(tag.createdAt)}
                    </td>

                    {/* Updated */}
                    <td className="p-3 align-middle whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
                      {formatDate(tag.updatedAt)}
                    </td>

                    {/* Actions dropdown */}
                    <td className="p-3 px-4 align-middle whitespace-nowrap text-right">
                      <div className="flex justify-end">
                        <ManagerActionsDropdown
                          triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                          actions={[
                            {
                              label: "Edit",
                              icon: Edit3,
                              onClick: () => openEdit(tag),
                            },
                            {
                              label: "Delete",
                              icon: Trash2,
                              onClick: () => setDeleteTarget(tag),
                              variant: "destructive",
                              showSeparatorBefore: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5">
            <span className="text-[11px] text-slate-400">
              Showing {filtered.length} of {tags.length} tags
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
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
