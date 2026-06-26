"use client";

import { useEffect, useRef } from "react";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolScriptItem } from "./tool-script-item";
import type { ScriptDraft } from "./types";

function createEmptyScript(sortOrder: number): ScriptDraft {
  return {
    _localId: crypto.randomUUID(),
    plugin: "gemini",
    label: "",
    description: "",
    sortOrder,
    config: {
      model: "",
      prompt: "",
    },
    creditCost: null,
  };
}

interface ToolScriptBuilderProps {
  scripts: ScriptDraft[];
  onChange: (scripts: ScriptDraft[]) => void;
  errors?: Record<string, { label?: string; plugin?: string; config?: string }>;
}

export function ToolScriptBuilder({ scripts, onChange, errors }: ToolScriptBuilderProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(scripts.length);

  useEffect(() => {
    if (scripts.length > prevLengthRef.current) {
      setTimeout(() => {
        const listEl = listRef.current;
        if (listEl && listEl.lastElementChild) {
          listEl.lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
    }
    prevLengthRef.current = scripts.length;
  }, [scripts.length]);

  function addScript() {
    onChange([...scripts, createEmptyScript(scripts.length)]);
  }

  function updateScript(index: number, draft: ScriptDraft) {
    const next = [...scripts];
    next[index] = draft;
    onChange(next);
  }

  function removeScript(index: number) {
    const remaining = scripts.filter((_, i) => i !== index);
    // Re-index sortOrder to ensure sequential values
    const reindexed = remaining.map((s, idx) => ({ ...s, sortOrder: idx }));
    onChange(reindexed);
  }

  function moveStep(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= scripts.length) return;
    const next = [...scripts];
    const target = next[fromIdx];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, target);
    // Re-index sortOrder to keep consistency
    const reindexed = next.map((s, idx) => ({ ...s, sortOrder: idx }));
    onChange(reindexed);
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between sticky -top-5 z-20 -mx-6 px-6 py-2.5 bg-white/95 backdrop-blur-xs border-b border-slate-100/80 mb-3">
        <div className="flex items-center gap-2">
          <Workflow className="size-4.5 text-slate-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Pipeline Steps</p>
            <p className="text-xs text-slate-500">
              {scripts.length === 0
                ? "No scripts/pipeline steps defined"
                : `${scripts.length} step${scripts.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addScript}
          className="h-8 gap-1.5 border-slate-200 text-xs"
        >
          <Plus className="size-3.5" />
          Add Step
        </Button>
      </div>

      {/* Empty state slots */}
      {scripts.length === 0 && (
        <button
          type="button"
          onClick={addScript}
          className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-xs text-slate-400 transition-colors hover:border-brand/40 hover:bg-brand/4 hover:text-brand"
        >
          Click to add the first pipeline step (e.g., Gemini prompt or Apify actor)
        </button>
      )}

      {/* Scripts cards list */}
      {scripts.length > 0 && (
        <div ref={listRef} className="space-y-3">
          {scripts.map((script, idx) => (
            <ToolScriptItem
              key={script._localId}
              script={script}
              index={idx}
              total={scripts.length}
              onChange={(draft) => updateScript(idx, draft)}
              onRemove={() => removeScript(idx)}
              onMoveUp={() => moveStep(idx, idx - 1)}
              onMoveDown={() => moveStep(idx, idx + 1)}
              error={errors?.[script._localId]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
