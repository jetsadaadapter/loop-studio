"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2, Search, Wrench } from "lucide-react";
import { getManageTools } from "@/core/services/manage-tools.service";
import { ManageToolApiItem } from "@/core/interfaces/tool";
import { getManageApps } from "@/core/services/apps.service";
import { getUserProfile } from "@/core/services/users.service";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

interface ToolSelectorProps {
  value: string;
  onChange: (toolId: string | null) => void;
  touched?: boolean;
  error?: string;
}

export function ToolSelector({ value, onChange, touched, error }: ToolSelectorProps) {
  const [tools, setTools] = useState<ManageToolApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedTool = tools.find((t) => t.id === value);

  const activeTools = tools.filter((t) => t.isActive);

  const filtered = query.trim()
    ? activeTools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.id.toLowerCase().includes(query.toLowerCase())
      )
    : activeTools;

  async function loadFallbackToolsFromApps() {
    try {
      const appsPage = await getManageApps({ page: 1, limit: 1000 });
      const appsList = appsPage.data ?? [];
      const extractedTools: ManageToolApiItem[] = [];
      const seenToolIds = new Set<string>();

      for (const app of appsList) {
        if (app.appTool && app.appTool.tool && app.appTool.toolId) {
          const toolId = app.appTool.toolId;
          if (!seenToolIds.has(toolId)) {
            seenToolIds.add(toolId);
            extractedTools.push({
              id: toolId,
              name: app.appTool.tool.name,
              description: app.appTool.tool.description ?? "",
              isActive: app.appTool.tool.isActive,
              creditCost: 0,
              userId: app.appTool.tool.userId ?? "",
              params: (app.appTool.tool.params ?? []).map(p => ({
                id: p.id,
                toolId: p.toolId,
                key: p.key,
                label: p.label,
                type: p.type,
                defaultValue: p.defaultValue,
                transform: p.transform,
                placeholder: p.placeholder,
                options: p.options,
                required: p.required,
                sortOrder: p.sortOrder,
                config: p.config ?? null,
              })),
              scripts: (app.appTool.tool.scripts ?? []).map(s => ({
                id: s.id,
                toolId: s.toolId,
                plugin: s.plugin,
                config: s.config ?? {},
                label: s.label,
                description: s.description,
                sortOrder: s.sortOrder,
                creditCost: s.creditCost ?? null,
              })),
              sortOrder: app.appTool.sortOrder ?? 0,
              createdAt: app.appTool.createdAt ?? "",
              updatedAt: app.appTool.tool.updatedAt ?? "",
            });
          }
        }
      }
      setTools(extractedTools);
    } catch {
      setTools([]);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const profile = await getUserProfile();
        if (cancelled) return;
        const hasAccess = (profile.roles ?? []).some(
          (r) => r === "admin" || r === "system-admin"
        );
        if (!hasAccess) {
          await loadFallbackToolsFromApps();
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await getManageTools();
        if (!cancelled) setTools(data);
      } catch {
        if (!cancelled) {
          await loadFallbackToolsFromApps();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      setDropdownRect(triggerRef.current.getBoundingClientRect());
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(toolId: string) {
    onChange(toolId);
    setOpen(false);
    setQuery("");
  }

  return (
    <Field>
      <FieldLabel>
        CTA Link <span className="text-destructive">*</span>
      </FieldLabel>

      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !loading && setOpen((v) => !v)}
          disabled={loading}
          className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none
            ${open ? "border-ring ring-[3px] ring-ring/50" : "border-input"}
            ${loading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-slate-300 bg-background"}
          `}
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Loading tools…
            </span>
          ) : selectedTool ? (
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${selectedTool.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
              />
              <span className="truncate text-xs font-medium text-slate-800">
                {selectedTool.name}
              </span>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-sans text-[9px] text-slate-500">
                {selectedTool.id.slice(0, 10)}…
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Select a tool…</span>
          )}
          <ChevronDown
            className={`ml-2 size-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown — rendered via portal to escape parent overflow:hidden */}
        {open && dropdownRect && typeof document !== "undefined" && createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownRect.bottom + 4,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 9999,
            }}
            className="rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search className="size-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID…"
                className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  ✕
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
                  <Wrench className="size-4 text-slate-300" />
                  <span className="text-xs text-slate-400">No tools match your search</span>
                </div>
              ) : (
                filtered.map((tool) => {
                  const isSelected = tool.id === value;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelect(tool.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                        isSelected ? "bg-slate-50" : ""
                      }`}
                    >
                      <span className={`mt-0.5 size-2 shrink-0 rounded-full ${tool.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800 leading-snug">{tool.name}</p>
                        <p className="mt-0.5 truncate font-sans text-[9px] text-slate-400 leading-snug">{tool.id}</p>
                      </div>
                      {isSelected && <Check className="size-3.5 shrink-0 text-emerald-600" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {!(touched && error) && (
        <FieldDescription>
          เลือก Tool ที่ต้องการลิงก์ไป (ระบบจะสร้างลิงก์เป็น /tool/รหัสเครื่องมืออัตโนมัติ)
        </FieldDescription>
      )}
      <FieldError errors={touched ? [{ message: error }] : []} />
    </Field>
  );
}
