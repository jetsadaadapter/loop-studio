import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ParamDraft } from "./types";
import { getManageAiModels } from "@/core/services/models.service";
import type { ManageAiApiListItem } from "@/core/interfaces/models.interface";
import { PromptEditor } from "./prompt-editor";

const PARAM_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "url", label: "URL" },
  { value: "select", label: "Select" },
  { value: "prompt", label: "Prompt (AI)" },
];

interface ToolParamItemProps {
  param: ParamDraft;
  index: number;
  onChange: (draft: ParamDraft) => void;
  onRemove: () => void;
  error?: { key?: string; label?: string; configPrompt?: string };
}

export function ToolParamItem({ param, index, onChange, onRemove, error }: ToolParamItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [models, setModels] = useState<ManageAiApiListItem[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const hasFetchedRef = useRef(false);

  function update(partial: Partial<ParamDraft>) {
    onChange({ ...param, ...partial });
  }

  useEffect(() => {
    if (param.type === "prompt" && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setIsLoadingModels(true);
      getManageAiModels()
        .then((list) => {
          const activeModels = list.filter((m) => m.isActive);
          setModels(activeModels);
          if (!param.configModel && activeModels.length > 0) {
            const defaultModel = activeModels.find((m) => m.isDefault) || activeModels[0];
            if (defaultModel) {
              update({ configModel: defaultModel.modelSlug });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load models:", err);
          hasFetchedRef.current = false;
        })
        .finally(() => {
          setIsLoadingModels(false);
        });
    }
  }, [param.type]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3.5 rounded-xl border border-slate-200/50 bg-slate-50/30 p-4 shadow-sm hover:border-slate-350 hover:shadow-md hover:shadow-indigo-500/2 transition-all duration-300">
      {/* Expandable Delete Confirmation Block */}
      {showConfirm && (
        <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 p-3.5 animate-fade-in flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-start gap-2 text-left">
            <span className="size-1.5 rounded-full bg-brand animate-pulse mt-1.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">Delete Parameter?</p>
              <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                Are you sure you want to delete this parameter? This action cannot be undone and will immediately remove the configuration from this tool.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="h-7 px-2.5 text-[10px] font-semibold border-slate-200 text-slate-600 hover:bg-slate-100/50 rounded-lg bg-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                onRemove();
              }}
              className="h-7 px-2.5 text-[10px] font-bold bg-brand hover:bg-brand-strong text-white rounded-lg shadow-sm border-none cursor-pointer"
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Param header */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Parameter {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-slate-400 hover:bg-brand/5 hover:text-brand transition-colors"
          onClick={() => {
            const isSaved = param.id && !param.id.startsWith("local-") && param.id.length > 8;
            if (isSaved) {
              setShowConfirm(true);
            } else {
              onRemove();
            }
          }}
          aria-label="Remove parameter"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Core fields grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className={`text-xs font-semibold ${error?.key ? "text-brand" : "text-slate-600"}`}>
            Key <span className="text-brand">*</span>
          </Label>
          <Input
            value={param.key}
            onChange={(e) => update({ key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
            placeholder="e.g. startUrls"
            className={`h-8 bg-white text-xs ${
              error?.key
                ? "border-brand focus-visible:ring-brand focus-visible:border-brand-strong/30 shadow-xs shadow-brand/5"
                : "border-slate-200"
            }`}
          />
          {error?.key && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{error.key}</p>}
        </div>
        <div className="space-y-1">
          <Label className={`text-xs font-semibold ${error?.label ? "text-brand" : "text-slate-600"}`}>
            Label <span className="text-brand">*</span>
          </Label>
          <Input
            value={param.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="e.g. Post URLs"
            className={`h-8 bg-white text-xs ${
              error?.label
                ? "border-brand focus-visible:ring-brand focus-visible:border-brand-strong/30 shadow-xs shadow-brand/5"
                : "border-slate-200"
            }`}
          />
          {error?.label && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{error.label}</p>}
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-600">Type <span className="text-brand">*</span></Label>
          <Select value={param.type} onValueChange={(v) => { if (v !== null) update({ type: v }); }}>
            <SelectTrigger className="h-8 bg-white border-slate-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARAM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2.5 pb-1.5">
          <Switch
            id={`req-${param._localId}`}
            checked={param.required}
            onCheckedChange={(v: boolean) => update({ required: v })}
          />
          <Label htmlFor={`req-${param._localId}`} className="cursor-pointer text-xs font-medium text-slate-600">
            Required
          </Label>
        </div>
      </div>

      {/* Placeholder — non-prompt types */}
      {param.type !== "prompt" && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-600">Placeholder</Label>
          <Input
            value={param.placeholder}
            onChange={(e) => update({ placeholder: e.target.value })}
            placeholder="Optional hint shown to user"
            className="h-8 bg-white border-slate-200 text-xs"
          />
        </div>
      )}

      {/* Prompt config — prompt type only */}
      {param.type === "prompt" && (
        <div className="space-y-3 border-l-2 border-brand pl-3.5 pb-3.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-brand">
            AI Config
          </p>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600">Model</Label>
            <Select
              value={param.configModel}
              onValueChange={(v) => {
                if (v !== null) {
                  let newPrompt = param.configPrompt || "";
                  const modelRegex = /("model"\s*:\s*")[^"]*(")/g;
                  if (modelRegex.test(newPrompt)) {
                    newPrompt = newPrompt.replace(modelRegex, `$1${v}$2`);
                  }
                  update({ 
                    configModel: v,
                    configPrompt: newPrompt
                  });
                }
              }}
              disabled={isLoadingModels}
            >
              <SelectTrigger className="h-8 bg-white border-slate-200 text-xs">
                <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select AI model"} />
              </SelectTrigger>
              <SelectContent className="min-w-[260px]">
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.modelSlug} className="text-xs">
                    {model.name} {model.isDefault ? "(Default)" : ""}
                  </SelectItem>
                ))}
                {models.length === 0 && !isLoadingModels && (
                  <SelectItem value="gemini-2.5-flash" disabled className="text-xs">
                    No models found (Fallback: Gemini 2.5 Flash)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={`text-xs font-semibold ${error?.configPrompt ? "text-brand" : "text-slate-600"}`}>
              System Prompt <span className="text-brand">*</span>
            </Label>
            <PromptEditor
              value={param.configPrompt || ""}
              onChange={(v) => update({ configPrompt: v })}
              placeholder="Enter system prompt instructions…"
              disabled={isLoadingModels}
              hasError={!!error?.configPrompt}
            />
            {error?.configPrompt && (
              <p className="text-[9px] text-brand font-semibold leading-none mt-1">
                {error.configPrompt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
