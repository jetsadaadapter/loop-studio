"use client";

import { useState, useEffect, startTransition } from "react";
import { Sparkles, Save } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptEditor } from "@/app/manage/tools/components/prompt-editor";
import { syncPromptModelReferences } from "@/app/manage/tools/components/model-prompt-utils";
import { getManageAiModels } from "@/core/services/models.service";
import type { ManageAiApiListItem } from "@/core/interfaces/models.interface";
import type { PromptItem, CreatePromptPayload } from "@/core/interfaces/prompt";

interface PromptFormDrawerProps {
  open: boolean;
  onClose: () => void;
  promptItem: PromptItem | null; // null if creating
  onSave: (payload: CreatePromptPayload) => Promise<void>;
  isSaving: boolean;
}

export function PromptFormDrawer({
  open,
  onClose,
  promptItem,
  onSave,
  isSaving,
}: PromptFormDrawerProps) {
  const [models, setModels] = useState<ManageAiApiListItem[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promptText, setPromptText] = useState("");
  const [type, setType] = useState<"system" | "user">("system");
  const [version, setVersion] = useState("1.0.0");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [remark, setRemark] = useState("");
  const [modelId, setModelId] = useState("");

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when promptItem changes
  useEffect(() => {
    if (open) {
      startTransition(() => {
        if (promptItem) {
          setName(promptItem.name || "");
          setDescription(promptItem.description || "");
          setPromptText(promptItem.prompt || "");
          setType(promptItem.type || "system");
          setVersion(promptItem.version || "1.0.0");
          setVisibility(promptItem.visibility || "private");
          setRemark(promptItem.remark || "");
          setModelId(promptItem.modelId || "");
        } else {
          setName("");
          setDescription("");
          setPromptText("");
          setType("system");
          setVersion("1.0.0");
          setVisibility("private");
          setRemark("");
          setModelId("");
        }
        setErrors({});
      });
    }
  }, [open, promptItem]);

  // Fetch models
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setIsLoadingModels(true);
      });
      getManageAiModels()
        .then((list) => {
          const active = list.filter((m) => m.isActive);
          startTransition(() => {
            setModels(active);
            const initialModelId = promptItem?.modelId || "";
            if (!initialModelId && active.length > 0) {
              const defaultModel = active.find((m) => m.isDefault) || active[0];
              if (defaultModel) {
                setModelId(defaultModel.id);
              }
            }
          });
        })
        .catch((err) => console.error("Failed to load AI models:", err))
        .finally(() => {
          startTransition(() => {
            setIsLoadingModels(false);
          });
        });
    }
  }, [open, promptItem]);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!promptText.trim()) nextErrors.promptText = "Prompt text is required";
    if (!modelId) nextErrors.modelId = "Target model is required";
    if (!version.trim()) nextErrors.version = "Version is required";
    if (!description.trim()) nextErrors.description = "Description is required";
    if (!remark.trim()) nextErrors.remark = "Remark is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreatePromptPayload = {
      userId: promptItem?.userId || "C164670E-E119-426A-9CE5-C94C9AB32764", // default fallback
      name: name.trim(),
      prompt: promptText.trim(),
      description: description.trim() || undefined,
      type,
      version: version.trim(),
      visibility,
      remark: remark.trim() || undefined,
      modelId,
    };

    startTransition(() => {
      void onSave(payload);
    });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col h-full bg-white max-w-lg w-full sm:max-w-xl p-0 shadow-2xl border-l border-slate-200">
        <SheetHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-200/60 px-6 py-4 space-y-0">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="size-4.5 text-brand animate-pulse-slow" />
            <SheetTitle className="text-sm font-bold text-slate-800 tracking-tight leading-none">
              {promptItem ? "Edit Prompt Persona" : "Create Prompt Persona"}
            </SheetTitle>
          </div>
          {/* <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-7 text-slate-400 hover:text-slate-900 rounded-md cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </Button> */}
        </SheetHeader>

        {/* Scrollable Form Body */}
        {isLoadingModels ? (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 animate-pulse select-none">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Name Skeleton */}
              <div className="space-y-1.5 col-span-2">
                <div className="h-3 w-24 bg-slate-100 rounded-sm" />
                <div className="h-8.5 w-full bg-slate-50 border border-slate-100 rounded-sm" />
              </div>

              {/* Model Skeleton */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <div className="h-3 w-20 bg-slate-100 rounded-sm" />
                <div className="h-8.5 w-full bg-slate-50 border border-slate-100 rounded-sm" />
              </div>

              {/* Version Skeleton */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <div className="h-3 w-16 bg-slate-100 rounded-sm" />
                <div className="h-8.5 w-full bg-slate-50 border border-slate-100 rounded-sm" />
              </div>

              {/* Type Skeleton */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <div className="h-3 w-20 bg-slate-100 rounded-sm" />
                <div className="h-8.5 w-full bg-slate-50 border border-slate-100 rounded-sm" />
              </div>

              {/* Visibility Skeleton */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <div className="h-3 w-16 bg-slate-100 rounded-sm" />
                <div className="h-8.5 w-full bg-slate-50 border border-slate-100 rounded-sm" />
              </div>

              {/* Description Skeleton */}
              <div className="space-y-1.5 col-span-2">
                <div className="h-3 w-20 bg-slate-100 rounded-sm" />
                <div className="h-8.5 w-full bg-slate-50 border border-slate-100 rounded-sm" />
              </div>

              {/* Remark Skeleton */}
              <div className="space-y-1.5 col-span-2">
                <div className="h-3 w-16 bg-slate-100 rounded-sm" />
                <div className="h-8.5 w-full bg-slate-50 border border-slate-100 rounded-sm" />
              </div>
            </div>

            {/* Prompt Editor Skeleton */}
            <div className="space-y-1.5 pt-2 col-span-2">
              <div className="h-3 w-32 bg-slate-100 rounded-sm" />
              <div className="h-44 w-full bg-slate-50 border border-slate-100 rounded-sm" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Name */}
              <div className="space-y-1.5 col-span-2">
                <Label className={`text-xs font-semibold ${errors.name ? "text-brand" : "text-slate-600"}`}>
                  Prompt Name <span className="text-brand">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Technical Copywriter Persona"
                  className={`h-8.5 text-xs bg-white ${errors.name ? "border-brand focus-visible:ring-brand/20" : "border-slate-200"}`}
                />
                {errors.name && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{errors.name}</p>}
              </div>

              {/* Model Selection */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className={`text-xs font-semibold ${errors.modelId ? "text-brand" : "text-slate-600"}`}>
                  Target Model <span className="text-brand">*</span>
                </Label>
                <Select
                  value={modelId}
                  onValueChange={(val) => {
                    const nextId = val || "";
                    const prevModel = models.find((m) => m.id === modelId) || promptItem?.model;
                    const nextModel = models.find((m) => m.id === nextId);

                    const prevSlug = prevModel?.modelSlug || "";
                    const nextSlug = nextModel?.modelSlug || "";

                    setModelId(nextId);

                    if (nextSlug) {
                      setPromptText((prev) =>
                        syncPromptModelReferences(prev, nextSlug, prevSlug)
                      );
                    }
                  }}
                  disabled={isLoadingModels}
                >
                  <SelectTrigger className={`h-8.5 bg-white text-xs ${errors.modelId ? "border-brand" : "border-slate-200"}`}>
                    <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select AI model"}>
                      {models.find((m) => m.id === modelId)?.name || promptItem?.model?.name || modelId || (isLoadingModels ? "Loading models..." : "Select AI model")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.modelId && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{errors.modelId}</p>}
              </div>

              {/* Version */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-600">
                  Version <span className="text-brand">*</span>
                </Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.0.0"
                  className="h-8.5 text-xs bg-white border-slate-200"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-600">Persona Type</Label>
                <Select value={type} onValueChange={(val) => val && setType(val as "system" | "user")}>
                  <SelectTrigger className="h-8.5 bg-white text-xs border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system" className="text-xs">System Persona</SelectItem>
                    <SelectItem value="user" className="text-xs">User Prompt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-600">Visibility</Label>
                <Select value={visibility} onValueChange={(val) => val && setVisibility(val as "public" | "private")}>
                  <SelectTrigger className="h-8.5 bg-white text-xs border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private" className="text-xs">Private</SelectItem>
                    <SelectItem value="public" className="text-xs">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5 col-span-2">
                <Label className={`text-xs font-semibold ${errors.description ? "text-brand" : "text-slate-600"}`}>
                  Description <span className="text-brand">*</span>
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this prompt is designed to accomplish"
                  className={`h-8.5 text-xs bg-white ${errors.description ? "border-brand focus-visible:ring-brand/20" : "border-slate-200"}`}
                />
                {errors.description && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{errors.description}</p>}
              </div>

              {/* Remark */}
              <div className="space-y-1.5 col-span-2">
                <Label className={`text-xs font-semibold ${errors.remark ? "text-brand" : "text-slate-600"}`}>
                  Remark <span className="text-brand">*</span>
                </Label>
                <Input
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="e.g. Deployed in customer widget"
                  className={`h-8.5 text-xs bg-white ${errors.remark ? "border-brand focus-visible:ring-brand/20" : "border-slate-200"}`}
                />
                {errors.remark && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{errors.remark}</p>}
              </div>
            </div>

            {/* System Prompt Instructions Editor */}
            <div className="space-y-1.5 pt-2">
              <Label className={`text-xs font-semibold ${errors.promptText ? "text-brand" : "text-slate-600"}`}>
                Instructions (Prompt) <span className="text-brand">*</span>
              </Label>
              <PromptEditor
                value={promptText}
                onChange={setPromptText}
                placeholder="Configure system persona prompt instructions here..."
                hasError={!!errors.promptText}
              />
              {errors.promptText && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{errors.promptText}</p>}
            </div>
          </form>
        )}

        {/* Footer Actions (Sticky) */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 px-6 py-4.5 bg-slate-50/70 select-none shrink-0 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Save Prompt
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
