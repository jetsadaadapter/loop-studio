"use client";

import { useEffect, useState, startTransition } from "react";
import { Link2, Loader2, Sparkles, LayoutGrid, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getManageApiKeysResponse } from "@/core/services/keys.service";
import { getManageTools } from "@/core/services/manage-tools.service";
import { getManageApps } from "@/core/services/apps.service";
import { updateProjectConnections } from "@/core/services/projects.service";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

interface ConnectionDialogProps {
  project: ProjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedProject: ProjectItem) => void;
  userContext?: { userId?: string; userName?: string; userAvatar?: string };
}

export function ConnectionDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
  userContext,
}: ConnectionDialogProps) {
  const [activeSubTab, setActiveSubTab] = useState<"apps" | "tools" | "keys">("apps");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Available options
  const [availableApps, setAvailableApps] = useState<Array<{ id: string; name: string }>>([]);
  const [availableTools, setAvailableTools] = useState<Array<{ id: string; name: string }>>([]);
  const [availableKeys, setAvailableKeys] = useState<Array<{ id: string; name: string }>>([]);

  // Selected state
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Load options on open
  useEffect(() => {
    if (open && project) {
      startTransition(() => {
        setErrorMsg("");
        setIsLoadingData(true);

        // Pre-fill selection
        setSelectedApps(project.connectedAppIds ?? []);
        setSelectedTools(project.connectedToolIds ?? []);
        setSelectedKeys(project.connectedApiKeyIds ?? []);
      });

      Promise.all([
        getManageApps({ page: 1, limit: 1000 }).catch(() => ({ data: [] })),
        getManageTools().catch(() => []),
        getManageApiKeysResponse(1, 1000).catch(() => ({ data: [] })),
      ])
        .then(([appsRes, toolsData, keysRes]) => {
          startTransition(() => {
            // Safe mapping
            const rawApps = Array.isArray(appsRes.data)
              ? appsRes.data
              : "items" in appsRes && Array.isArray(appsRes.items)
              ? appsRes.items
              : [];
            setAvailableApps(
              (rawApps as Array<{ id?: string; appId?: string; name?: string }>).map((a) => ({
                id: a.id ?? a.appId ?? "",
                name: a.name ?? "",
              })).filter((a) => a.id)
            );

            setAvailableTools(
              toolsData.map((t) => ({
                id: t.id,
                name: t.name,
              }))
            );

            setAvailableKeys(
              keysRes.data.map((k) => ({
                id: k.id ?? k.appId ?? "",
                name: k.name,
              })).filter((k) => k.id)
            );
          });
        })
        .catch((err) => {
          console.error("Failed to load connection candidates:", err);
          setErrorMsg("Could not fetch list of available resources.");
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  }, [open, project]);

  if (!project) return null;

  const toggleSelect = (type: "apps" | "tools" | "keys", itemId: string) => {
    if (type === "apps") {
      setSelectedApps((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    } else if (type === "tools") {
      setSelectedTools((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    } else {
      setSelectedKeys((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const updated = await updateProjectConnections(
        project.id,
        selectedApps,
        selectedTools,
        selectedKeys,
        undefined,
        userContext
      );
      onSuccess(updated);
      onOpenChange(false);
    } catch {
      setErrorMsg("Failed to update connections.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubTabCount = (type: "apps" | "tools" | "keys") => {
    if (type === "apps") return selectedApps.length;
    if (type === "tools") return selectedTools.length;
    return selectedKeys.length;
  };

  const renderOptionList = (
    type: "apps" | "tools" | "keys",
    options: Array<{ id: string; name: string }>,
    selectedList: string[]
  ) => {
    if (isLoadingData) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      );
    }

    if (options.length === 0) {
      return (
        <div className="text-center py-10 text-slate-400 text-xs font-semibold select-none">
          No available items of this type found.
        </div>
      );
    }

    return (
      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
        {options.map((opt) => {
          const isSelected = selectedList.includes(opt.id);
          return (
            <label
              key={`${type}:${opt.id}`}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer select-none ${
                isSelected
                  ? "border-brand/35 bg-brand/5 text-slate-800"
                  : "border-slate-200/60 bg-white text-slate-650 hover:bg-slate-50"
              }`}
            >
              <span className="truncate pr-4">{opt.name}</span>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(type, opt.id)}
                className="size-4 rounded border-slate-350 text-brand focus:ring-0 cursor-pointer"
              />
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] w-full rounded-2xl bg-white border border-slate-200/60 shadow-xl font-sans p-6">
        <DialogHeader className="space-y-1 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="size-5 text-brand" />
            <span>Connect Resources</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Link APIs, tools, and apps to project: <span className="font-semibold text-slate-700">{project.name}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-100 mt-4 select-none">
          {(["apps", "tools", "keys"] as const).map((tab) => {
            const isActive = activeSubTab === tab;
            const label = tab === "apps" ? "Apps" : tab === "tools" ? "Tools" : "API Keys";
            const icon =
              tab === "apps" ? (
                <LayoutGrid className="size-3.5 mr-1" />
              ) : tab === "tools" ? (
                <Sparkles className="size-3.5 mr-1" />
              ) : (
                <KeyRound className="size-3.5 mr-1" />
              );
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`flex-1 pb-2 text-xs font-bold border-b-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isActive
                    ? "border-brand text-brand"
                    : "border-transparent text-slate-500 hover:text-slate-750"
                }`}
              >
                {icon}
                {label}
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-sans font-bold text-slate-500">
                  {getSubTabCount(tab)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Option list container */}
        <div className="pt-4 min-h-[220px]">
          {activeSubTab === "apps" && renderOptionList("apps", availableApps, selectedApps)}
          {activeSubTab === "tools" && renderOptionList("tools", availableTools, selectedTools)}
          {activeSubTab === "keys" && renderOptionList("keys", availableKeys, selectedKeys)}
        </div>

        {errorMsg && <p className="text-xs font-semibold text-red-650 pt-2">{errorMsg}</p>}

        <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end select-none">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || isLoadingData}
            className="h-10 text-xs font-bold bg-brand text-white shadow-sm hover:bg-brand-strong cursor-pointer min-w-[90px]"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
