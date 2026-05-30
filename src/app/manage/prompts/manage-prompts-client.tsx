"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { Workflow, AlertCircle, Plus, Search, SlidersHorizontal, List, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/toast-provider";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { getManagePrompts, createManagePrompt, updateManagePrompt, deleteManagePrompt } from "@/core/services/prompts.service";
import type { PromptItem, CreatePromptPayload } from "@/core/interfaces/prompt";
import { PromptTable } from "./components/prompt-table";
import { PromptFormDrawer } from "./components/prompt-form-drawer";
import { PromptCard } from "./components/prompt-card";

export function ManagePromptsClient() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [, startTransition] = useTransition();
  const { pushToast } = useToast();

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");

  // Pagination & ViewMode states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Reset page when filters or pageSize change
  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1);
    });
  }, [searchQuery, filterType, filterVisibility, pageSize]);

  // Drawer & Edit states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PromptItem | null>(null);

  // Delete dialog states
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load prompts
  const loadPrompts = () => {
    setIsLoading(true);
    setErrorMsg("");
    getManagePrompts()
      .then((data) => setPrompts(data))
      .catch((err) => {
        console.error("Failed to load prompts:", err);
        setErrorMsg("Failed to retrieve prompts from backend API.");
        pushToast("Could not load prompts list.", "error");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    startTransition(() => {
      loadPrompts();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Edit trigger
  const handleEditClick = (item: PromptItem) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  // Handle Create trigger
  const handleCreateClick = () => {
    setEditingItem(null);
    setIsDrawerOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSave = async (payload: CreatePromptPayload) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        // PATCH Update
        const updated = await updateManagePrompt(editingItem.id, payload);
        setPrompts((prev) => prev.map((p) => (p.id === editingItem.id ? updated : p)));
        pushToast(`"${updated.name}" saved successfully.`, "success");
      } else {
        // POST Create
        const created = await createManagePrompt(payload);
        setPrompts((prev) => [created, ...prev]);
        pushToast(`"${created.name}" created successfully.`, "success");
      }
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Failed to save prompt:", err);
      pushToast("Failed to save prompt data.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete trigger
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteManagePrompt(deleteId);
      setPrompts((prev) => prev.filter((p) => p.id !== deleteId));
      pushToast("Prompt deleted successfully.", "success");
    } catch (err) {
      console.error("Failed to delete prompt:", err);
      pushToast("Failed to delete prompt.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // Filtered prompts computed logic
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || p.type === filterType;
    const matchesVisibility = filterVisibility === "all" || p.visibility === filterVisibility;

    return matchesSearch && matchesType && matchesVisibility;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPrompts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedPrompts = useMemo(() => {
    const pageStart = (safeCurrentPage - 1) * pageSize;
    return filteredPrompts.slice(pageStart, pageStart + pageSize);
  }, [safeCurrentPage, filteredPrompts, pageSize]);

  const pageRange = useMemo(() => {
    const pages = [] as number[];
    const start = Math.max(1, safeCurrentPage - 1);
    const end = Math.min(totalPages, start + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (!pages.includes(1)) pages.unshift(1);
    if (!pages.includes(totalPages)) pages.push(totalPages);

    return Array.from(new Set(pages));
  }, [safeCurrentPage, totalPages]);

  const resultStart = filteredPrompts.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const resultEnd = Math.min(safeCurrentPage * pageSize, filteredPrompts.length);

  return (
    <ManagerShell
      title="Prompt Personas"
      description="Manage, test, and configure dynamic instructions to control the personas and behaviors of your target AI models."
      actions={null}
    >
      {/* Search and Filters Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
        {/* Left Group */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full xl:w-80 shrink-0">
            <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search prompts by name, description, content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-slate-400"
            />
          </div>

          {/* Select Filters Wrapper */}
          <div className="flex items-center gap-3 w-full xl:w-auto">
            {/* Type Select */}
            <div className="flex items-center gap-2 flex-1 xl:flex-initial">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Type</span>
              <div className="flex-1 xl:w-32">
                <Select value={filterType} onValueChange={(val) => val && setFilterType(val)}>
                  <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="system">System Personas</SelectItem>
                    <SelectItem value="user">User Prompts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visibility Select */}
            <div className="flex items-center gap-2 flex-1 xl:flex-initial">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Visibility</span>
              <div className="flex-1 xl:w-28">
                <Select value={filterVisibility} onValueChange={(val) => val && setFilterVisibility(val)}>
                  <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
                    <SelectValue placeholder="All Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visibility</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Filter Icon Button */}
            {(searchQuery || filterType !== "all" || filterVisibility !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterVisibility("all");
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
        <div className="flex items-center gap-2 justify-between xl:justify-end shrink-0">
          <Button
            type="button"
            disabled={isLoading || isSaving}
            onClick={handleCreateClick}
            className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center"
          >
            <Plus className="size-4 shrink-0" />
            Add Prompt
          </Button>

          {/* Layout Mode Icons Group */}
          <div className="h-8 flex items-center border border-slate-200 rounded-sm p-0.5 bg-slate-50/50 shadow-3xs shrink-0 select-none">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`h-7 w-7 rounded-sm transition-all cursor-pointer flex items-center justify-center ${
                viewMode === "list"
                  ? "text-white bg-brand shadow-sm shadow-brand/10 border border-brand/50"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white"
              }`}
              title="Table view"
            >
              <List className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`h-7 w-7 rounded-sm transition-all cursor-pointer flex items-center justify-center ${
                viewMode === "grid"
                  ? "text-white bg-brand shadow-sm shadow-brand/10 border border-brand/50"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="size-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      {errorMsg ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white border border-slate-200 rounded-sm p-6">
          <AlertCircle className="size-8 text-brand animate-bounce-slow" />
          <p className="text-sm font-semibold text-slate-800">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={loadPrompts} className="h-8 border-slate-200 cursor-pointer">
            Retry Loading
          </Button>
        </div>
      ) : !isLoading && filteredPrompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white border border-dashed border-slate-200 rounded-sm p-6 select-none">
          <div className="size-12 rounded-sm bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
            <Workflow className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">No Prompts Found</p>
            <p className="text-xs text-slate-500 mt-1">
              {prompts.length === 0
                ? "Click the button above to add your first dynamic prompt template."
                : "Try adjusting your search query or filter settings."}
            </p>
          </div>
          {prompts.length === 0 && (
            <Button
              type="button"
              onClick={handleCreateClick}
              className="h-8 bg-brand hover:bg-brand/80 text-white text-xs font-semibold px-4.5 rounded-sm cursor-pointer"
            >
              Create First Prompt
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "list" ? (
            <PromptTable
              prompts={isLoading ? [] : pagedPrompts}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col justify-between p-5 bg-white border border-slate-200/80 rounded-2xl shadow-3xs animate-pulse h-[225px] select-none">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="h-4 w-32 bg-slate-100 rounded-sm" />
                          <div className="flex gap-1.5">
                            <div className="h-3.5 w-12 bg-slate-100 rounded-full" />
                            <div className="h-3.5 w-14 bg-slate-100 rounded-full" />
                          </div>
                        </div>
                        <div className="h-4 w-12 bg-slate-100 rounded-full shrink-0" />
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="h-3 w-full bg-slate-100 rounded-sm" />
                        <div className="h-3 w-5/6 bg-slate-100 rounded-sm" />
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="h-2 w-16 bg-slate-100 rounded-sm" />
                        <div className="h-4.5 w-28 bg-slate-100 rounded-full" />
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <div className="size-7 bg-slate-100 rounded-sm" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                pagedPrompts.map((item) => (
                  <PromptCard
                    key={item.id}
                    promptItem={item}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))
              )}
            </div>
          )}

          {/* Premium Custom Pagination Footer */}
          {!isLoading && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 select-none">
              {/* Left side: Results descriptor and Page Size dropdown */}
              <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                <span>
                  Results: {resultStart} - {resultEnd} of {filteredPrompts.length}
                </span>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="font-normal text-slate-400">Page size:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => val && setPageSize(Number(val))}
                  >
                    <SelectTrigger className="h-8 w-16 rounded-sm border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-3xs cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right side: Modern Pagination Controls */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="size-8 rounded-sm border border-slate-200/60 hover:bg-slate-50 cursor-pointer text-slate-500 transition-colors shadow-3xs flex items-center justify-center bg-white"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {pageRange.map((page) => (
                  <Button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`size-8 text-xs font-bold rounded-sm transition-all flex items-center justify-center cursor-pointer ${
                      page === safeCurrentPage
                        ? "bg-brand text-white shadow-sm shadow-brand/10"
                        : "border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-3xs bg-white"
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="size-8 rounded-sm border border-slate-200/60 hover:bg-slate-50 cursor-pointer text-slate-500 transition-colors shadow-3xs flex items-center justify-center bg-white"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Drawer */}
      <PromptFormDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        promptItem={editingItem}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Unified Delete Confirmation Modal */}
      {deleteId ? (
        <ManagerDeleteConfirm
          itemTypeLabel="prompt"
          itemName={prompts.find((p) => p.id === deleteId)?.name || ""}
          itemId={deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      ) : null}
    </ManagerShell>
  );
}
