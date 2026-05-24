"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type {
  ManageToolApiItem,
  ToolParam,
  CreateToolPayload,
  UpdateToolPayload,
  ToolParamPayload,
} from "@/core/interfaces/tool";
import { ToolParamBuilder } from "./tool-param-builder";
import type { ParamDraft, ToolFormMode } from "./types";

// ── Conversion helpers ────────────────────────────────────────────────────────

function paramToDraft(param: ToolParam): ParamDraft {
  const config = (param.config ?? {}) as { model?: string; prompt?: string };
  return {
    _localId: param.id,
    id: param.id,
    key: param.key,
    label: param.label,
    type: param.type,
    required: param.required,
    sortOrder: param.sortOrder,
    defaultValue: param.defaultValue ?? "",
    placeholder: param.placeholder ?? "",
    configModel: config.model ?? "",
    configPrompt: config.prompt ?? "",
  };
}

function draftToPayload(draft: ParamDraft, idx: number): ToolParamPayload {
  const payload: ToolParamPayload = {
    key: draft.key.trim(),
    label: draft.label.trim(),
    type: draft.type,
    required: draft.required,
    sortOrder: idx,
  };
  if (draft.id) payload.id = draft.id;
  if (draft.placeholder.trim()) payload.placeholder = draft.placeholder.trim();
  if (draft.defaultValue.trim()) payload.defaultValue = draft.defaultValue.trim();
  if (draft.type === "prompt") {
    payload.config = {
      ...(draft.configModel.trim() && { model: draft.configModel.trim() }),
      ...(draft.configPrompt.trim() && { prompt: draft.configPrompt.trim() }),
    };
  }
  return payload;
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  isActive: boolean;
  params: ParamDraft[];
}

function buildInitialState(tool: ManageToolApiItem | null): FormState {
  if (!tool) return { name: "", description: "", isActive: true, params: [] };
  return {
    name: tool.name,
    description: tool.description ?? "",
    isActive: tool.isActive,
    params: tool.params.map(paramToDraft),
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ToolFormDrawerProps {
  mode: ToolFormMode | null;
  tool: ManageToolApiItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (payload: CreateToolPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateToolPayload) => Promise<void>;
}

// ── Inner form (keyed externally to reset state) ──────────────────────────────

function ToolFormInner({
  mode, tool, isSubmitting, onClose, onCreate, onUpdate,
}: ToolFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(tool));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function clearError(key: string) {
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Tool name is required.";
    const invalid = form.params.filter((p) => !p.key.trim() || !p.label.trim());
    if (invalid.length > 0) next.params = "Every parameter must have a key and label.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || isSubmitting) return;
    const payload: CreateToolPayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      isActive: form.isActive,
      params: form.params.map((p, idx) => draftToPayload(p, idx)),
    };
    if (mode === "create") {
      await onCreate(payload);
    } else if (mode === "edit" && tool) {
      await onUpdate(tool.id, payload);
    }
  }

  return (
    <>
      {/* Header */}
      <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-slate-200/60 px-6 py-4">
        <SheetTitle className="text-base font-semibold text-slate-900">
          {mode === "create" ? "New Tool" : "Edit Tool"}
        </SheetTitle>
        {/* <Button type="button" variant="ghost" size="icon"
          className="size-8 shrink-0 text-slate-400 hover:text-slate-700"
          onClick={onClose} aria-label="Close drawer"
        >
          <X className="size-4" />
        </Button> */}
      </SheetHeader>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Basic info */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Basic Info</p>

          <div className="space-y-1.5">
            <Label htmlFor="tf-name" className="text-sm font-medium text-slate-700">
              Tool Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="tf-name"
              value={form.name}
              onChange={(e) => { update({ name: e.target.value }); clearError("name"); }}
              placeholder="e.g. FB Post Analyzer"
              className={errors.name ? "border-rose-300 bg-white" : "bg-white"}
            />
            {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tf-desc" className="text-sm font-medium text-slate-700">Description</Label>
            <Input
              id="tf-desc"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Optional short description"
              className="bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="tf-active"
              checked={form.isActive}
              onCheckedChange={(v: boolean) => update({ isActive: v })}
            />
            <Label htmlFor="tf-active" className="cursor-pointer text-sm text-slate-700">Active</Label>
            <span className="text-xs text-slate-400">
              {form.isActive ? "Visible to users" : "Hidden from users"}
            </span>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Parameters */}
        <div className="space-y-3">
          {errors.params && <p className="text-xs text-rose-500">{errors.params}</p>}
          <ToolParamBuilder
            params={form.params}
            onChange={(params) => { update({ params }); clearError("params"); }}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 bg-white px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="min-w-[5rem]"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving…
            </span>
          ) : mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </>
  );
}

// ── Shell (Sheet wrapper) ─────────────────────────────────────────────────────

export function ToolFormDrawer(props: ToolFormDrawerProps) {
  const formKey = `${props.mode ?? "closed"}-${props.tool?.id ?? "new"}`;
  return (
    <Sheet open={props.mode !== null} onOpenChange={(open) => { if (!open) props.onClose(); }}>
      <SheetContent side="right" className="flex w-full max-w-lg flex-col p-0">
        {props.mode !== null && <ToolFormInner key={formKey} {...props} />}
      </SheetContent>
    </Sheet>
  );
}
