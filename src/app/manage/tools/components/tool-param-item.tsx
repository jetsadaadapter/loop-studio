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
}

export function ToolParamItem({ param, index, onChange, onRemove }: ToolParamItemProps) {
  function update(partial: Partial<ParamDraft>) {
    onChange({ ...param, ...partial });
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200/60 bg-white p-4 shadow-xs">
      {/* Param header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Parameter {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
          onClick={onRemove}
          aria-label="Remove parameter"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Core fields grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Key *</Label>
          <Input
            value={param.key}
            onChange={(e) => update({ key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
            placeholder="e.g. startUrls"
            className="h-8 bg-slate-50/60 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Label *</Label>
          <Input
            value={param.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="e.g. Post URLs"
            className="h-8 bg-slate-50/60 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Type *</Label>
          <Select value={param.type} onValueChange={(v) => { if (v !== null) update({ type: v }); }}>
            <SelectTrigger className="h-8 bg-slate-50/60 text-xs">
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

        <div className="flex items-end gap-2.5 pb-1">
          <Switch
            id={`req-${param._localId}`}
            checked={param.required}
            onCheckedChange={(v: boolean) => update({ required: v })}
          />
          <Label htmlFor={`req-${param._localId}`} className="cursor-pointer text-xs text-slate-600">
            Required
          </Label>
        </div>
      </div>

      {/* Placeholder — non-prompt types */}
      {param.type !== "prompt" && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Placeholder</Label>
          <Input
            value={param.placeholder}
            onChange={(e) => update({ placeholder: e.target.value })}
            placeholder="Optional hint shown to user"
            className="h-8 bg-slate-50/60 text-xs"
          />
        </div>
      )}

      {/* Prompt config — prompt type only */}
      {param.type === "prompt" && (
        <div className="space-y-3 border-l-2 border-indigo-200 pl-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            AI Config
          </p>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Model</Label>
            <Input
              value={param.configModel}
              onChange={(e) => update({ configModel: e.target.value })}
              placeholder="e.g. gemini-2.0-flash"
              className="h-8 bg-slate-50/60 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">System Prompt</Label>
            <Textarea
              value={param.configPrompt}
              onChange={(e) => update({ configPrompt: e.target.value })}
              placeholder="Enter system prompt instructions…"
              rows={5}
              className="resize-y bg-slate-50/60 text-xs leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
