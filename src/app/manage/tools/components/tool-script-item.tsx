"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Trash2, Terminal, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScriptDraft } from "./types";
import { getManageAiModels } from "@/core/services/models.service";
import type { ManageAiApiListItem } from "@/core/interfaces/models.interface";
import { PromptEditor } from "./prompt-editor";
import { DynamicConfigBuilder } from "./dynamic-config-builder";

const PLUGIN_TYPES = [
  { value: "gemini", label: "Gemini AI" },
  { value: "apify", label: "Apify" },
  { value: "custom", label: "Custom Plugin" },
];

interface ToolScriptItemProps {
  script: ScriptDraft;
  index: number;
  total: number;
  onChange: (draft: ScriptDraft) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  error?: { label?: string; plugin?: string; config?: string };
}

export function ToolScriptItem({
  script,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  error,
}: ToolScriptItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [models, setModels] = useState<ManageAiApiListItem[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [rawJson, setRawJson] = useState(() => {
    if (script.plugin !== "gemini" && script.plugin !== "apify") {
      return JSON.stringify(script.config, null, 2);
    }
    return "";
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputTemplateJson, setInputTemplateJson] = useState(() => {
    if (script.plugin === "apify" && script.config.inputTemplate) {
      return JSON.stringify(script.config.inputTemplate, null, 2);
    }
    return "";
  });
  const [templateError, setTemplateError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  function update(partial: Partial<ScriptDraft>) {
    onChange({ ...script, ...partial });
  }

  function updateConfig(newConfig: Record<string, unknown>) {
    update({ config: newConfig });
  }

  function handleTemplateChange(val: string) {
    setInputTemplateJson(val);
    if (!val.trim()) {
      setTemplateError(null);
      const nextConfig = { ...script.config };
      delete nextConfig.inputTemplate;
      updateConfig(nextConfig);
      return;
    }
    try {
      const parsed = JSON.parse(val) as Record<string, unknown>;
      setTemplateError(null);
      updateConfig({ ...script.config, inputTemplate: parsed });
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  useEffect(() => {
    if (script.plugin === "gemini" && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setIsLoadingModels(true);
      getManageAiModels()
        .then((list) => {
          const activeModels = list.filter((m) => m.isActive);
          setModels(activeModels);
          // Do not auto-write modelSlug on mount to keep it optional and show placeholder
        })
        .catch((err) => console.error("Failed to load models:", err))
        .finally(() => setIsLoadingModels(false));
    }
  }, [script.plugin]);



  function handleJsonChange(val: string) {
    setRawJson(val);
    if (!val.trim()) {
      setJsonError(null);
      updateConfig({});
      return;
    }
    try {
      const parsed = JSON.parse(val) as Record<string, unknown>;
      setJsonError(null);
      updateConfig(parsed);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  const isGemini = script.plugin === "gemini";
  const isApify = script.plugin === "apify";
  const isCustom = !isGemini && !isApify;

  return (
    <div className="space-y-3.5 rounded-xl border border-slate-200/50 bg-slate-50/30 p-4 shadow-sm hover:border-slate-350 hover:shadow-md hover:shadow-indigo-500/2 transition-all duration-300">
      {showConfirm && (
        <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 p-3.5 animate-fade-in flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-start gap-2 text-left">
            <span className="size-1.5 rounded-full bg-brand animate-pulse mt-1.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">Delete Script Step?</p>
              <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                Are you sure you want to remove this pipeline step? Saving changes will permanently delete it from this tool.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="h-7 px-2.5 text-[10px] font-semibold border-slate-200 text-slate-600 rounded-lg bg-white"
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Step {index + 1}</span>
          <div className="flex gap-0.5">
            <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={onMoveUp} className="size-5 text-slate-400 hover:text-slate-700"><ArrowUp className="size-3" /></Button>
            <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={onMoveDown} className="size-5 text-slate-400 hover:text-slate-700"><ArrowDown className="size-3" /></Button>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-7 text-slate-400 hover:text-brand" onClick={() => {
          if (script.id && !script.id.startsWith("local-")) setShowConfirm(true); else onRemove();
        }}><Trash2 className="size-3.5" /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label className={`text-xs font-semibold ${error?.label ? "text-brand" : "text-slate-600"}`}>Label <span className="text-brand">*</span></Label>
          <Input value={script.label} onChange={(e) => update({ label: e.target.value })} placeholder="e.g. Run scraper" className={`h-8 bg-white text-xs ${error?.label ? "border-brand" : "border-slate-200"}`} />
          {error?.label && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{error.label}</p>}
        </div>

        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label className="text-xs font-semibold text-slate-600">Plugin Type <span className="text-brand">*</span></Label>
          <Select value={isGemini ? "gemini" : isApify ? "apify" : "custom"} onValueChange={(v) => {
            if (v === "gemini") {
              update({ plugin: "gemini", config: { model: "", prompt: "" } });
            } else if (v === "apify") {
              setInputTemplateJson("");
              setTemplateError(null);
              update({ plugin: "apify", config: { actorId: "", inputTemplate: {} } });
            } else {
              setRawJson(JSON.stringify({}, null, 2));
              setJsonError(null);
              update({ plugin: "custom", config: {} });
            }
          }}>
            <SelectTrigger className="h-8 bg-white border-slate-200 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLUGIN_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-slate-600">Custom Plugin Identifier <span className="text-brand">*</span></Label>
            <Input value={script.plugin === "custom" ? "" : script.plugin} onChange={(e) => update({ plugin: e.target.value.trim() })} placeholder="e.g. my-custom-plugin" className="h-8 bg-white border-slate-200 text-xs" />
          </div>
        )}

        <div className="space-y-1 col-span-2">
          <Label className="text-xs font-semibold text-slate-600">Description</Label>
          <Input value={script.description} onChange={(e) => update({ description: e.target.value })} placeholder="Describe what this step does" className="h-8 bg-white border-slate-200 text-xs" />
        </div>
      </div>

      {isGemini && (
        <div className="space-y-3 border-l-2 border-violet-500 pl-3.5 pb-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-600">
            <Image src="/images/icons/gemini-color.svg" width={14} height={14} className="size-3.5 shrink-0" alt="Gemini" /><span>Gemini AI Processor</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600">Model</Label>
            <Select value={(script.config.model as string) || ""} onValueChange={(v) => v && updateConfig({ ...script.config, model: v })} disabled={isLoadingModels}>
              <SelectTrigger className="h-8 bg-white border-slate-200 text-xs"><SelectValue placeholder="Select AI Model" /></SelectTrigger>
              <SelectContent>
                {models.map((m) => <SelectItem key={m.id} value={m.modelSlug} className="text-xs">{m.name}</SelectItem>)}
                {models.length === 0 && <SelectItem value="gemini-1.5-flash" className="text-xs">Gemini 1.5 Flash</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={`text-xs font-semibold ${error?.config ? "text-brand" : "text-slate-600"}`}>System Prompt</Label>
            <PromptEditor value={(script.config.prompt as string) || ""} onChange={(v) => updateConfig({ ...script.config, prompt: v })} placeholder="System Prompt instructions..." hasError={!!error?.config} />
            {error?.config && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{error.config}</p>}
          </div>
          <DynamicConfigBuilder label="Additional Parameters" value={script.config} onChange={updateConfig} excludeKeys={["model", "prompt"]} />
        </div>
      )}

      {isApify && (
        <div className="space-y-3 border-l-2 border-orange-500 pl-3.5 pb-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-orange-600">
            <Image src="/images/icons/apify-symbol-200x200.svg" width={14} height={14} className="size-3.5 shrink-0" alt="Apify" /><span>Apify Scraper</span>
          </div>
          <div className="space-y-1">
            <Label className={`text-xs font-semibold ${error?.config ? "text-brand" : "text-slate-600"}`}>Actor ID <span className="text-brand">*</span></Label>
            <Input value={(script.config.actorId as string) || ""} onChange={(e) => updateConfig({ ...script.config, actorId: e.target.value.trim() })} placeholder="e.g. apify/instagram-comment-scraper" className="h-8 bg-white text-xs border-slate-200" />
            {error?.config && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{error.config}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 font-sans">Input Template (JSON)</Label>
            <Textarea value={inputTemplateJson} onChange={(e) => handleTemplateChange(e.target.value)} placeholder='{"startUrls": "{{startUrls:urlObjects}}"}' className={`font-mono text-xs placeholder:text-xs bg-white ${templateError ? "border-brand focus-visible:ring-brand" : "border-slate-200"}`} rows={4} />
            {templateError && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{templateError}</p>}
          </div>
          <DynamicConfigBuilder label="Additional Parameters" value={script.config} onChange={updateConfig} excludeKeys={["actorId", "inputTemplate"]} />
        </div>
      )}

      {isCustom && (
        <div className="space-y-3 border-l-2 border-slate-400 pl-3.5 pb-2">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            <Terminal className="size-3" /><span>Raw Plugin Configuration</span>
          </div>
          <div className="space-y-1">
            <Textarea value={rawJson} onChange={(e) => handleJsonChange(e.target.value)} placeholder='{"key": "value"}' className={`font-mono text-xs placeholder:text-xs bg-white ${jsonError ? "border-brand focus-visible:ring-brand" : "border-slate-200"}`} rows={4} />
            {jsonError && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{jsonError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
