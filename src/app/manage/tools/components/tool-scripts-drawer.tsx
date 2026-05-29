"use client";

import { useEffect, useState, startTransition } from "react";
import { Workflow } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import type { ManageToolApiItem, ToolScript } from "@/core/interfaces/tool";
import {
  getManageToolScripts,
  upsertManageToolScripts,
  deleteManageToolScript,
  updateManageToolScript,
  createManageToolScript,
} from "@/core/services/manage-tools.service";
import { ToolScriptBuilder } from "./tool-script-builder";
import type { ScriptDraft } from "./types";

// ── Conversion Helpers ───────────────────────────────────────────────────────

function scriptToDraft(script: ToolScript): ScriptDraft {
  return {
    _localId: script.id,
    id: script.id,
    plugin: script.plugin,
    label: script.label,
    description: script.description ?? "",
    sortOrder: script.sortOrder,
    config: script.config || {},
  };
}

function draftToPayload(draft: ScriptDraft, idx: number): Partial<ToolScript> {
  const payload: Partial<ToolScript> = {
    plugin: draft.plugin.trim(),
    label: draft.label.trim(),
    description: draft.description.trim() || null,
    sortOrder: idx,
    config: draft.config,
  };
  if (draft.id && !draft.id.startsWith("local-") && draft.id.length > 8) {
    payload.id = draft.id;
  }
  return payload;
}

// ── Validation ────────────────────────────────────────────────────────────────

function getValidationErrors(scriptsList: ScriptDraft[]): {
  validationError: string | null;
  errors: Record<string, { label?: string; plugin?: string; config?: string }>;
} {
  const nextErrors: Record<string, { label?: string; plugin?: string; config?: string }> = {};
  let hasErrors = false;

  scriptsList.forEach((s) => {
    const fieldErrors: { label?: string; plugin?: string; config?: string } = {};

    if (!s.label.trim()) {
      fieldErrors.label = "Label is required";
      hasErrors = true;
    }
    if (!s.plugin.trim()) {
      fieldErrors.plugin = "Plugin identifier is required";
      hasErrors = true;
    }

    if (s.plugin === "gemini") {
      const prompt = s.config.prompt as string | undefined;
      if (!prompt || !prompt.trim()) {
        fieldErrors.config = "System Prompt is required for Gemini AI step";
        hasErrors = true;
      }
    } else if (s.plugin === "apify") {
      const actorId = s.config.actorId as string | undefined;
      if (!actorId || !actorId.trim()) {
        fieldErrors.config = "Actor ID is required for Apify step";
        hasErrors = true;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      nextErrors[s._localId] = fieldErrors;
    }
  });

  return {
    validationError: hasErrors ? "Every script step must be fully and validly configured." : null,
    errors: nextErrors,
  };
}

// ── In-flight Request Deduplication Registry ─────────────────────────────────
const inFlightScriptsRequests = new Map<string, Promise<ToolScript[]>>();

function fetchToolScriptsDeduplicated(toolId: string): Promise<ToolScript[]> {
  let promise = inFlightScriptsRequests.get(toolId);
  if (!promise) {
    promise = getManageToolScripts(toolId).finally(() => {
      inFlightScriptsRequests.delete(toolId);
    });
    inFlightScriptsRequests.set(toolId, promise);
  }
  return promise;
}

// ── Drawer Core ──────────────────────────────────────────────────────────────

interface ToolScriptsDrawerProps {
  tool: ManageToolApiItem | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

function ToolScriptsDrawerInner({
  tool,
  onClose,
  onSaveSuccess,
}: ToolScriptsDrawerProps) {
  const { pushToast } = useToast();
  const [scripts, setScripts] = useState<ScriptDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, { label?: string; plugin?: string; config?: string }>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const toolId = tool?.id;

  useEffect(() => {
    if (!toolId) return;
    let active = true;

    async function loadScripts() {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const data = await fetchToolScriptsDeduplicated(toolId!);
        if (!active) return;
        setScripts(data.map(scriptToDraft));
      } catch (err) {
        if (!active) return;
        console.error("Failed to load scripts:", err);
        setErrorMsg("Failed to retrieve scripts from server.");
        pushToast("Failed to load pipeline scripts.", "error");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    startTransition(() => {
      void loadScripts();
    });

    return () => {
      active = false;
    };
  }, [toolId, pushToast]);

  function validate(): boolean {
    setHasAttemptedSubmit(true);
    const result = getValidationErrors(scripts);
    setErrors(result.errors);
    setValidationError(result.validationError);
    return result.validationError === null;
  }

  async function handleSave() {
    if (!tool || isSaving) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      const promises = scripts.map(async (s, idx) => {
        const payload = draftToPayload(s, idx);
        if (s.id && !s.id.startsWith("local-") && s.id.length > 8) {
          return updateManageToolScript(s.id, payload);
        } else {
          return createManageToolScript(tool.id, payload);
        }
      });
      await Promise.all(promises);
      pushToast("Pipeline scripts saved successfully.", "success");
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save scripts:", err);
      pushToast("Failed to save pipeline scripts.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <SheetHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-200/60 px-6 py-4 space-y-0">
        <div className="flex items-center gap-2 text-brand">
          <Workflow className="size-4.5" />
          <SheetTitle className="text-base font-bold text-slate-800 tracking-tight">
            Manage Pipeline Scripts
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
            <span className="text-[10px] font-medium uppercase tracking-wider">Loading scripts…</span>
          </div>
        ) : errorMsg ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-brand font-medium">{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                getManageToolScripts(tool!.id)
                  .then((data) => setScripts(data.map(scriptToDraft)))
                  .catch(() => setErrorMsg("Failed to retrieve pipeline scripts."))
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
            <ToolScriptBuilder
              scripts={scripts}
              errors={errors}
              onChange={async (newScripts) => {
                const removed = scripts.find((s) => !newScripts.some((ns) => ns._localId === s._localId));
                if (removed?.id && !removed.id.startsWith("local-") && removed.id.length > 8) {
                  try {
                    await deleteManageToolScript(removed.id);
                    pushToast("Pipeline step deleted successfully.", "success");
                  } catch (err) {
                    console.error("Failed to delete script step:", err);
                    pushToast("Failed to delete pipeline step from server.", "error");
                    return;
                  }
                }
                setScripts(newScripts);
                if (hasAttemptedSubmit) {
                  const result = getValidationErrors(newScripts);
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
          className="min-w-[6.5rem] bg-brand text-white hover:bg-brand-strong shadow-sm"
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

export function ToolScriptsDrawer({
  tool,
  onClose,
  onSaveSuccess,
}: ToolScriptsDrawerProps) {
  return (
    <Sheet open={tool !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-full max-w-lg flex-col p-0 border-l border-slate-200 shadow-2xl">
        {tool !== null && (
          <ToolScriptsDrawerInner
            tool={tool}
            onClose={onClose}
            onSaveSuccess={onSaveSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
