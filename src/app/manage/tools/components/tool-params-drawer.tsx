"use client";

import { useEffect, useState, startTransition } from "react";
import { Wrench } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import type { ManageToolApiItem, ToolParam, ToolParamPayload } from "@/core/interfaces/tool";
import { getManageToolParams, upsertManageToolParams, deleteManageToolParam } from "@/core/services/manage-tools.service";
import { ToolParamBuilder } from "./tool-param-builder";
import type { ParamDraft } from "./types";

// ── Conversion Helpers ───────────────────────────────────────────────────────

function paramToDraft(param: ToolParam): ParamDraft {
  const config = (param.config ?? {}) as { model?: string; prompt?: string };
  return {
    _localId: param.id, id: param.id, key: param.key, label: param.label, type: param.type,
    required: param.required, sortOrder: param.sortOrder, defaultValue: param.defaultValue ?? "",
    placeholder: param.placeholder ?? "", configModel: config.model ?? "", configPrompt: config.prompt ?? "",
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
  if (draft.id && !draft.id.startsWith("local-") && draft.id.length > 8) payload.id = draft.id;
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

// ── In-flight Request Deduplication Registry ─────────────────────────────────
const inFlightParamsRequests = new Map<string, Promise<ToolParam[]>>();

function fetchToolParamsDeduplicated(toolId: string): Promise<ToolParam[]> {
  let promise = inFlightParamsRequests.get(toolId);
  if (!promise) {
    promise = getManageToolParams(toolId).finally(() => {
      inFlightParamsRequests.delete(toolId);
    });
    inFlightParamsRequests.set(toolId, promise);
  }
  return promise;
}

function getValidationErrors(paramsList: ParamDraft[]): {
  validationError: string | null;
  errors: Record<string, { key?: string; label?: string; configPrompt?: string }>;
} {
  const nextErrors: Record<string, { key?: string; label?: string; configPrompt?: string }> = {};
  let hasErrors = false;

  paramsList.forEach((p) => {
    const fieldErrors: { key?: string; label?: string; configPrompt?: string } = {};
    if (!p.key.trim()) {
      fieldErrors.key = "Key is required";
      hasErrors = true;
    }
    if (!p.label.trim()) {
      fieldErrors.label = "Label is required";
      hasErrors = true;
    }
    if (p.type === "prompt" && !p.configPrompt.trim()) {
      fieldErrors.configPrompt = "System Prompt is required for AI prompts";
      hasErrors = true;
    }
    if (Object.keys(fieldErrors).length > 0) {
      nextErrors[p._localId] = fieldErrors;
    }
  });

  return {
    validationError: hasErrors ? "Every parameter must be fully and validly configured." : null,
    errors: nextErrors,
  };
}

// ── Drawer Core ──────────────────────────────────────────────────────────────

interface ToolParamsDrawerProps {
  tool: ManageToolApiItem | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

function ToolParamsDrawerInner({
  tool,
  onClose,
  onSaveSuccess,
}: ToolParamsDrawerProps) {
  const { pushToast } = useToast();
  const [params, setParams] = useState<ParamDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, { key?: string; label?: string; configPrompt?: string }>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const toolId = tool?.id;

  useEffect(() => {
    if (!toolId) return;
    let active = true;

    async function loadParams() {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const data = await fetchToolParamsDeduplicated(toolId!);
        if (!active) return;
        setParams(data.map(paramToDraft));
      } catch (err) {
        if (!active) return;
        console.error("Failed to load parameters:", err);
        setErrorMsg("Failed to retrieve parameters from server.");
        pushToast("Failed to load parameters.", "error");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    startTransition(() => {
      void loadParams();
    });

    return () => {
      active = false;
    };
  }, [toolId, pushToast]);

  function validate(): boolean {
    setHasAttemptedSubmit(true);
    const result = getValidationErrors(params);
    setErrors(result.errors);
    setValidationError(result.validationError);
    return result.validationError === null;
  }

  async function handleSave() {
    if (!tool || isSaving) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = params.map((p, idx) => draftToPayload(p, idx));
      await upsertManageToolParams(tool.id, payload);
      pushToast("Parameters upserted successfully.", "success");
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to upsert parameters:", err);
      pushToast("Failed to save parameters.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <SheetHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-200/60 px-6 py-4 space-y-0">
        <div className="flex items-center gap-2 text-brand">
          <Wrench className="size-4.5" />
          <SheetTitle className="text-base font-bold text-slate-800 tracking-tight">
            Manage Parameters
          </SheetTitle>
        </div>
      </SheetHeader>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Tool Header Context Info */}
        <div className="mb-6 rounded-xl bg-slate-50/50 border border-slate-200/40 p-3">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Target Tool</span>
          <p className="text-sm font-bold text-slate-800 tracking-tight">{tool?.name}</p>
          <p className="font-sans text-[9px] text-slate-500 mt-0.5">id: {tool?.id}</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-brand animate-spin" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Loading parameters…</span>
          </div>
        ) : errorMsg ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-brand font-medium">{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                getManageToolParams(tool!.id)
                  .then((data) => setParams(data.map(paramToDraft)))
                  .catch(() => setErrorMsg("Failed to retrieve parameters."))
                  .finally(() => setIsLoading(false));
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {validationError && (
              <div className="rounded-xl border border-brand/10 bg-brand/5 px-4 py-2.5 text-xs text-brand font-semibold mb-2 animate-fade-in flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" aria-hidden />
                {validationError}
              </div>
            )}
             <ToolParamBuilder
              params={params}
              errors={errors}
              onChange={async (newParams) => {
                const removed = params.find((p) => !newParams.some((np) => np._localId === p._localId));
                if (removed?.id && !removed.id.startsWith("local-") && removed.id.length > 8) {
                  try {
                    await deleteManageToolParam(removed.id);
                    pushToast("Parameter deleted successfully.", "success");
                  } catch (err) {
                    console.error("Failed to delete parameter:", err);
                    pushToast("Failed to delete parameter from server.", "error");
                    return;
                  }
                }
                setParams(newParams);
                if (hasAttemptedSubmit) {
                  const result = getValidationErrors(newParams);
                  setErrors(result.errors);
                  setValidationError(result.validationError);
                } else {
                  setErrors({});
                  setValidationError(null);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Sticky Footer Action Bar */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 bg-white px-6 py-4.5">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={isLoading || isSaving}
          className="min-w-[6.5rem] bg-brand text-white hover:bg-brand-hover shadow-sm"
        >
          {isSaving ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving…
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Sheet Wrapper Shell ──────────────────────────────────────────────────────

export function ToolParamsDrawer({
  tool,
  onClose,
  onSaveSuccess,
}: ToolParamsDrawerProps) {
  return (
    <Sheet open={tool !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-full max-w-lg flex-col p-0 border-l border-slate-200 shadow-2xl">
        {tool !== null && (
          <ToolParamsDrawerInner
            tool={tool}
            onClose={onClose}
            onSaveSuccess={onSaveSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
