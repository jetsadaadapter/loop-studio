import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolParamItem } from "./tool-param-item";
import type { ParamDraft } from "./types";

function createEmptyParam(sortOrder: number): ParamDraft {
  return {
    _localId: crypto.randomUUID(),
    key: "",
    label: "",
    type: "text",
    required: false,
    sortOrder,
    defaultValue: "",
    placeholder: "",
    options: [],
    configModel: "",
    configPrompt: "",
  };
}

interface ToolParamBuilderProps {
  params: ParamDraft[];
  onChange: (params: ParamDraft[]) => void;
  errors?: Record<string, { key?: string; label?: string; configPrompt?: string }>;
}

export function ToolParamBuilder({ params, onChange, errors }: ToolParamBuilderProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(params.length);

  useEffect(() => {
    if (params.length > prevLengthRef.current) {
      setTimeout(() => {
        const listEl = listRef.current;
        if (listEl && listEl.lastElementChild) {
          listEl.lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
    }
    prevLengthRef.current = params.length;
  }, [params.length]);

  function addParam() {
    onChange([...params, createEmptyParam(params.length)]);
  }

  function updateParam(index: number, draft: ParamDraft) {
    const next = [...params];
    next[index] = draft;
    onChange(next);
  }

  function removeParam(index: number) {
    onChange(params.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between sticky -top-5 z-20 -mx-6 px-6 py-2.5 bg-white/95 backdrop-blur-xs border-b border-slate-100/80 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Parameters</p>
          <p className="text-xs text-slate-500">
            {params.length === 0
              ? "No parameters defined"
              : `${params.length} parameter${params.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addParam}
          className="h-8 gap-1.5 border-slate-200 text-xs"
        >
          <Plus className="size-3.5" />
          Add Param
        </Button>
      </div>

      {/* Empty slot */}
      {params.length === 0 && (
        <button
          type="button"
          onClick={addParam}
          className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center text-xs text-slate-400 transition-colors hover:border-brand/40 hover:bg-brand/4 hover:text-brand"
        >
          Click to add the first parameter
        </button>
      )}

      {/* Param cards */}
      {params.length > 0 && (() => {
        // prompt type / key="prompt" are single-param-only features.
        // Exception: a param that already has key="prompt" or type="prompt" keeps its values;
        // only OTHER params in a multi-param tool are blocked.
        const isMulti = params.length > 1;
        const promptParamIdx = params.findIndex(
          (p) => p.type === "prompt" || p.key === "prompt"
        );
        return (
        <div ref={listRef} className="space-y-3">
          {params.map((param, idx) => {
            const isPromptParam = idx === promptParamIdx;
            return (
            <ToolParamItem
              key={param._localId}
              promptReserved={isMulti && !isPromptParam}
              promptKeyReserved={isMulti && !isPromptParam}
              param={param}
              index={idx}
              onChange={(draft) => updateParam(idx, draft)}
              onRemove={() => removeParam(idx)}
              error={errors?.[param._localId]}
            />
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}
