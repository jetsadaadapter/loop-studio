"use client";

import { useState } from "react";
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

interface NestedConfig {
  promptId?: string;
  prompt?: {
    name?: string;
    prompt?: string;
    model?: {
      modelSlug?: string;
    };
  };
  model?: string;
}

function paramToDraft(param: ToolParam): ParamDraft {
  let config: NestedConfig = {};
  try {
    if (param.config) {
      config = typeof param.config === "string"
        ? JSON.parse(param.config)
        : (param.config as NestedConfig);
    }
  } catch (e) {
    console.error("Failed to parse param config:", e);
  }

  const configPromptId = config.promptId ?? "";
  const configPromptName = config?.prompt?.name || "";

  // Try extracting from the new nested object structure first
  let configModel = config?.prompt?.model?.modelSlug || "";
  let configPrompt = config?.prompt?.prompt || "";

  // Fallback to the old flat structure if the new one isn't populated
  if (!configModel && typeof config?.model === "string") {
    configModel = config.model;
  }
  if (!configPrompt && typeof config?.prompt === "string") {
    configPrompt = config.prompt;
  }

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
    transform: param.transform ?? null,
    options: param.options ? param.options.map(String) : [],
    configPromptId,
    configPromptName,
    configModel,
    configPrompt,
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
  if (draft.transform) payload.transform = draft.transform;
  if (draft.options && draft.options.length > 0) payload.options = draft.options;
  if (draft.type === "prompt") {
    payload.config = {
      ...(draft.configPromptId?.trim() && { promptId: draft.configPromptId.trim() }),
    };
  }
  return payload;
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  isActive: boolean;
  creditCost: number;
  params: ParamDraft[];
}

function buildInitialState(tool: ManageToolApiItem | null): FormState {
  if (!tool) return { name: "", description: "", isActive: true, creditCost: 1, params: [] };
  return {
    name: tool.name,
    description: tool.description ?? "",
    isActive: tool.isActive,
    creditCost: tool.creditCost ?? 1,
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

function getFormValidationErrors(formState: FormState): {
  nameError: string;
  paramErrors: Record<string, { key?: string; label?: string; configPrompt?: string }>;
  validationError: string | null;
} {
  const nextParamErrors: Record<string, { key?: string; label?: string; configPrompt?: string }> = {};
  let nameError = "";
  let hasParamErrors = false;

  if (!formState.name.trim()) {
    nameError = "Tool name is required.";
  }

  formState.params.forEach((p) => {
    const fieldErrors: { key?: string; label?: string; configPrompt?: string } = {};
    if (!p.key.trim()) {
      fieldErrors.key = "Key is required";
      hasParamErrors = true;
    }
    if (!p.label.trim()) {
      fieldErrors.label = "Label is required";
      hasParamErrors = true;
    }
    if (p.type === "prompt" && !p.configPrompt.trim()) {
      fieldErrors.configPrompt = "System Prompt is required for AI prompts";
      hasParamErrors = true;
    }
    if (Object.keys(fieldErrors).length > 0) {
      nextParamErrors[p._localId] = fieldErrors;
    }
  });

  return {
    nameError,
    paramErrors: nextParamErrors,
    validationError: hasParamErrors ? "Every parameter must be fully and validly configured." : null,
  };
}

// ── Inner form (keyed externally to reset state) ──────────────────────────────

function ToolFormInner({
  mode, tool, isSubmitting, onClose, onCreate, onUpdate,
}: ToolFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(tool));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [paramErrors, setParamErrors] = useState<Record<string, { key?: string; label?: string; configPrompt?: string }>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  function update(partial: Partial<FormState>) {
    setForm((prev) => {
      const next = { ...prev, ...partial };
      const { nameError, paramErrors: nextParamErrors, validationError: nextValErr } = getFormValidationErrors(next);

      if (hasAttemptedSubmit) {
        setErrors({ name: nameError });
        setParamErrors(nextParamErrors);
        setValidationError(nextValErr);
      } else {
        if (partial.name !== undefined) {
          setErrors({ name: nameError });
        }
        setParamErrors({});
        setValidationError(null);
      }
      return next;
    });
  }

  function validate(): boolean {
    setHasAttemptedSubmit(true);
    const { nameError, paramErrors: nextParamErrors, validationError: nextValErr } = getFormValidationErrors(form);

    setErrors({ name: nameError });
    setParamErrors(nextParamErrors);
    setValidationError(nextValErr);

    return !nameError && nextValErr === null;
  }

  async function handleSubmit() {
    if (!validate() || isSubmitting) return;
    const payload: CreateToolPayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      isActive: form.isActive,
      creditCost: form.creditCost,
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
              Tool Name <span className="text-brand">*</span>
            </Label>
            <Input
              id="tf-name"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="e.g. FB Post Analyzer"
              className={errors.name ? "border-brand focus-visible:ring-brand focus-visible:border-brand-strong/30 shadow-xs shadow-brand/5 bg-white" : "bg-white"}
            />
            {errors.name && <p className="text-[11px] font-semibold text-brand mt-1">{errors.name}</p>}
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

          <div className="space-y-1.5">
            <Label htmlFor="tf-credit-cost" className="text-sm font-medium text-slate-700">
              Credit Cost <span className="text-slate-400 font-normal text-xs">(tool usage based)</span>
            </Label>
            <Input
              id="tf-credit-cost"
              type="number"
              min={0}
              step={1}
              value={form.creditCost}
              onChange={(e) => update({ creditCost: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="bg-white w-32"
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
          {validationError && (
            <div className="rounded-xl border border-brand/10 bg-brand/5 px-4 py-2.5 text-xs text-brand font-semibold mb-2 animate-fade-in flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-brand animate-pulse" aria-hidden />
              {validationError}
            </div>
          )}
          <ToolParamBuilder
            params={form.params}
            errors={paramErrors}
            onChange={(params) => update({ params })}
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
