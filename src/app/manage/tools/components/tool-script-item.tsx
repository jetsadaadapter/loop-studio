"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Trash2, Terminal, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
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
import { getPlugins } from "@/core/services/manage-tools.service";
import { getManagePrompts } from "@/core/services/prompts.service";
import type { PromptItem } from "@/core/interfaces/prompt";
import type { ManageAiApiListItem } from "@/core/interfaces/models.interface";
import { PromptEditor } from "./prompt-editor";
import { DynamicConfigBuilder } from "./dynamic-config-builder";
import { syncPromptModelReferences } from "./model-prompt-utils";


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
  const [isExpanded, setIsExpanded] = useState(true);
  const [plugins, setPlugins] = useState<{ value: string; label: string }[]>([
    { value: "gemini", label: "Gemini AI" },
    { value: "apify", label: "Apify" },
  ]);
  const [models, setModels] = useState<ManageAiApiListItem[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [promptsList, setPromptsList] = useState<PromptItem[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [promptMode, setPromptMode] = useState<"customize" | "central">(() => {
    return script.config.promptId ? "central" : "customize";
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let active = true;
    getPlugins()
      .then((list) => {
        if (!active) return;
        if (list.length > 0) {
          const mapped = list.map((p) => {
            let label = p.name;
            if (p.name === "gemini") label = "Gemini AI";
            else if (p.name === "apify") label = "Apify";
            else if (p.name.length > 0) {
              label = p.name.charAt(0).toUpperCase() + p.name.slice(1);
            }
            return { value: p.name, label };
          });
          setPlugins(mapped);
        }
      })
      .catch((err) => console.error("Failed to load plugins:", err));

    return () => {
      active = false;
    };
  }, []);
  const [rawJson, setRawJson] = useState(() => {
    if (script.plugin !== "gemini" && script.plugin !== "apify") {
      return JSON.stringify(script.config, null, 2);
    }
    return "";
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputTemplateJson, setInputTemplateJson] = useState(() => {
    if (script.config.inputTemplate) {
      return JSON.stringify(script.config.inputTemplate, null, 2);
    }
    return "";
  });
  const [templateError, setTemplateError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const initialConfigRef = useRef<{
    promptMode: "customize" | "central";
    promptId?: string;
    prompt?: string;
    model?: string;
  } | null>(null);
  const userCustomizePromptRef = useRef<string | null>(null);
  const userCustomizeModelRef = useRef<string | null>(null);

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
      setIsLoadingPrompts(true);
      Promise.all([
        getManageAiModels(),
        getManagePrompts()
      ])
        .then(([modelsList, promptsRes]) => {
          const activeModels = modelsList.filter((m) => m.isActive);
          setModels(activeModels);
          const data = promptsRes.data || [];
          setPromptsList(data);
          if (script.config.promptId) {
            setPromptMode("central");
            const selected = data.find((p) => p.id === script.config.promptId);
            const resolvedPrompt = selected ? selected.prompt : (script.config.prompt as string) || "";
            const resolvedModel = selected ? selected.model?.modelSlug || "" : (script.config.model as string) || "";

            initialConfigRef.current = {
              promptMode: "central",
              promptId: script.config.promptId as string,
              prompt: resolvedPrompt,
              model: resolvedModel,
            };

            if (selected) {
              const updatedConfig: Record<string, unknown> = {
                ...script.config,
                prompt: resolvedPrompt,
              };
              if (selected.model?.modelSlug) {
                updatedConfig.model = selected.model.modelSlug;
              }
              if (
                script.config.prompt !== resolvedPrompt ||
                script.config.model !== resolvedModel
              ) {
                updateConfig(updatedConfig);
              }
            }
          } else {
            initialConfigRef.current = {
              promptMode: "customize",
              prompt: (script.config.prompt as string) || "",
              model: (script.config.model as string) || "",
            };
            userCustomizePromptRef.current = (script.config.prompt as string) || "";
            userCustomizeModelRef.current = (script.config.model as string) || "";
          }
        })
        .catch((err) => {
          console.error("Failed to load models or prompts:", err);
          hasFetchedRef.current = false;
        })
        .finally(() => {
          setIsLoadingModels(false);
          setIsLoadingPrompts(false);
        });
    }
  }, [script.plugin]); // eslint-disable-line react-hooks/exhaustive-deps



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

  const [editMode, setEditMode] = useState<"visual" | "raw">("visual");

  const [prevPlugin, setPrevPlugin] = useState<string>(script.plugin);
  const [prevInputTemplate, setPrevInputTemplate] = useState<unknown>(script.config.inputTemplate);
  const [prevConfig, setPrevConfig] = useState<unknown>(script.config);

  if (prevPlugin !== script.plugin) {
    setPrevPlugin(script.plugin);
    setEditMode("visual");
  }

  if (JSON.stringify(prevInputTemplate) !== JSON.stringify(script.config.inputTemplate)) {
    setPrevInputTemplate(script.config.inputTemplate);
    setInputTemplateJson(script.config.inputTemplate ? JSON.stringify(script.config.inputTemplate, null, 2) : "");
  }

  if (JSON.stringify(prevConfig) !== JSON.stringify(script.config)) {
    setPrevConfig(script.config);
    if (script.plugin !== "gemini" && script.plugin !== "apify") {
      setRawJson(JSON.stringify(script.config, null, 2));
    }
  }

  const isGemini = script.plugin === "gemini";
  const isApify = script.plugin === "apify";
  const isCustom = !isGemini && !isApify;

  const pluginKey = (script.plugin || "").toLowerCase().trim();
  const badgeStyles = pluginKey.startsWith("exportcomments")
    ? { bg: "bg-violet-50/70", border: "border-violet-100/40", text: "text-violet-600" }
    : pluginKey === "gemini"
    ? { bg: "bg-sky-50/70", border: "border-sky-100/40", text: "text-sky-600" }
    : pluginKey === "apify"
    ? { bg: "bg-orange-50/70", border: "border-orange-100/40", text: "text-orange-600" }
    : { bg: "bg-slate-100", border: "border-slate-200/50", text: "text-slate-500" };

  const displayPlugins = [...plugins];
  if (script.plugin && !displayPlugins.some((p) => p.value === script.plugin)) {
    let label = script.plugin;
    if (script.plugin.length > 0) {
      label = script.plugin.charAt(0).toUpperCase() + script.plugin.slice(1);
    }
    displayPlugins.push({ value: script.plugin, label });
  }

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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-left hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
            title={isExpanded ? "Collapse step" : "Expand step"}
          >
            {isExpanded ? (
              <ChevronUp className="size-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="size-3.5 text-slate-400" />
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 select-none">
              Step {index + 1}
            </span>
          </button>

          <span
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-slate-700 truncate cursor-pointer hover:text-slate-900 select-none max-w-[120px]"
            title={script.label}
          >
            {script.label || <span className="text-slate-400 italic">(No label)</span>}
          </span>

          <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[8px] font-bold uppercase font-sans select-none shrink-0 border ${badgeStyles.bg} ${badgeStyles.border} ${badgeStyles.text}`}>
            {script.plugin}
          </span>

          {!isExpanded && (
            <span className="text-[10px] text-slate-400 truncate max-w-[200px] font-sans font-medium select-none ml-2">
              {isGemini
                ? (script.config.model as string) || "Select AI Model"
                : isApify
                ? (script.config.actorId as string) || "Enter Actor ID"
                : "Configured"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex gap-0.5 border border-slate-200/60 rounded-md bg-white p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={onMoveUp}
              className="size-6 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm cursor-pointer"
              title="Move Step Up"
            >
              <ArrowUp className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === total - 1}
              onClick={onMoveDown}
              className="size-6 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm cursor-pointer"
              title="Move Step Down"
            >
              <ArrowDown className="size-3" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:bg-brand/5 hover:text-brand rounded-md cursor-pointer"
            onClick={() => {
              if (script.id && !script.id.startsWith("local-")) setShowConfirm(true); else onRemove();
            }}
            title="Delete Step"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className={`text-xs font-semibold ${error?.label ? "text-brand" : "text-slate-600"}`}>Label <span className="text-brand">*</span></Label>
              <Input value={script.label} onChange={(e) => update({ label: e.target.value })} placeholder="e.g. Run scraper" className={`h-8 bg-white text-xs ${error?.label ? "border-brand" : "border-slate-200"}`} />
              {error?.label && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{error.label}</p>}
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs font-semibold text-slate-600">Plugin Type <span className="text-brand">*</span></Label>
              <Select value={script.plugin || ""} onValueChange={(v) => {
                if (!v) return;
                if (v === "gemini") {
                  update({ plugin: "gemini", config: { model: "", prompt: "" } });
                } else if (v === "apify") {
                  setInputTemplateJson("");
                  setTemplateError(null);
                  update({ plugin: "apify", config: { actorId: "", inputTemplate: {} } });
                } else {
                  setRawJson(JSON.stringify({}, null, 2));
                  setJsonError(null);
                  update({ plugin: v, config: {} });
                }
              }}>
                <SelectTrigger className="h-8 bg-white border-slate-200 text-xs w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {displayPlugins.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 col-span-2">
              <Label className="text-xs font-semibold text-slate-600">Description</Label>
              <Input value={script.description} onChange={(e) => update({ description: e.target.value })} placeholder="Describe what this step does" className="h-8 bg-white border-slate-200 text-xs" />
            </div>
          </div>

          {isGemini && (
            <div className="space-y-3 border-l-2 border-sky-500 pl-3.5 pb-2">
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-sky-600">
                <Image src="/images/icons/gemini-color.svg" width={14} height={14} className="size-3.5 shrink-0" alt="Gemini" /><span>Gemini AI Processor</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Model</Label>
                <Select
                  value={(script.config.model as string) || ""}
                  onValueChange={(v) => {
                    if (!v) return;

                    const previousModel =
                      typeof script.config.model === "string" ? script.config.model : "";
                    const existingPrompt =
                      typeof script.config.prompt === "string" ? script.config.prompt : "";

                    updateConfig({
                      ...script.config,
                      model: v,
                      prompt: syncPromptModelReferences(existingPrompt, v, previousModel),
                    });
                  }}
                  disabled={isLoadingModels || promptMode === "central"}
                >
                  <SelectTrigger className={`h-8 border-slate-200 text-xs w-full ${promptMode === "central" ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white"}`}>
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => <SelectItem key={m.id} value={m.modelSlug} className="text-xs">{m.name}</SelectItem>)}
                    {models.length === 0 && <SelectItem value="gemini-1.5-flash" className="text-xs">Gemini 1.5 Flash</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 font-sans">Prompt Source</Label>
                <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/40 w-fit">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPromptMode("customize");
                      const nextConfig = { ...script.config };
                      delete nextConfig.promptId;
                      
                      if (userCustomizePromptRef.current !== null) {
                        nextConfig.prompt = userCustomizePromptRef.current;
                        if (userCustomizeModelRef.current) {
                          nextConfig.model = userCustomizeModelRef.current;
                        }
                      } else if (initialConfigRef.current?.promptMode === "customize") {
                        nextConfig.prompt = initialConfigRef.current.prompt || "";
                        if (initialConfigRef.current.model) {
                          nextConfig.model = initialConfigRef.current.model;
                        }
                      } else {
                        nextConfig.prompt = "";
                      }
                      
                      updateConfig(nextConfig);
                    }}
                    className={`h-6 px-2.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      promptMode === "customize"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-400 hover:text-slate-750"
                    }`}
                  >
                    Customize Prompt
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      userCustomizePromptRef.current = (script.config.prompt as string) || "";
                      userCustomizeModelRef.current = (script.config.model as string) || "";

                      setPromptMode("central");
                      const nextConfig = { ...script.config };
                      
                      if (initialConfigRef.current?.promptMode === "central") {
                        nextConfig.promptId = initialConfigRef.current.promptId;
                        nextConfig.prompt = initialConfigRef.current.prompt || "";
                        if (initialConfigRef.current.model) {
                          nextConfig.model = initialConfigRef.current.model;
                        }
                      } else {
                        delete nextConfig.promptId;
                        nextConfig.prompt = "";
                      }
                      
                      updateConfig(nextConfig);
                    }}
                    className={`h-6 px-2.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      promptMode === "central"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-400 hover:text-slate-750"
                    }`}
                  >
                    Central Prompt
                  </Button>
                </div>
              </div>

              {promptMode === "central" && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-600">Central Prompt <span className="text-brand">*</span></Label>
                  <Select
                    value={(script.config.promptId as string) || ""}
                    onValueChange={(v) => {
                      if (!v) return;
                      const selected = promptsList.find((p) => p.id === v);
                      if (selected) {
                        updateConfig({
                          ...script.config,
                          promptId: v,
                          prompt: selected.prompt,
                          ...(selected.model?.modelSlug && { model: selected.model.modelSlug }),
                        });
                      }
                    }}
                    disabled={isLoadingPrompts}
                  >
                    <SelectTrigger className="w-full h-8 bg-white border-slate-200 text-xs">
                      <SelectValue placeholder={isLoadingPrompts ? "Loading prompts..." : "Select Central Prompt"}>
                        {promptsList.find((p) => p.id === script.config.promptId)?.name ||
                          (isLoadingPrompts ? "Loading prompts..." : "Select Central Prompt")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {promptsList.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name} (v{p.version})
                        </SelectItem>
                      ))}
                      {promptsList.length === 0 && !isLoadingPrompts && (
                        <SelectItem value="none" disabled className="text-xs">
                          No central prompts found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className={`text-xs font-semibold ${error?.config ? "text-brand" : "text-slate-600"}`}>
                  System Prompt {promptMode === "central" && <span className="text-slate-400 font-normal ml-1">(Read-only template)</span>}
                </Label>
                <PromptEditor
                  value={(script.config.prompt as string) || ""}
                  onChange={(v) => {
                    if (promptMode === "customize") {
                      updateConfig({ ...script.config, prompt: v });
                    }
                  }}
                  placeholder={promptMode === "central" ? "Select a Prompt Persona to load instructions…" : "System Prompt instructions..."}
                  hasError={!!error?.config}
                  disabled={promptMode === "central"}
                />
                {error?.config && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{error.config}</p>}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100/60">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-650 transition-colors w-fit select-none cursor-pointer"
                >
                  {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  <span>Optional Parameters</span>
                </button>
                {showAdvanced && (
                  <div className="pt-2">
                    <DynamicConfigBuilder
                      label="Additional Parameters"
                      value={script.config}
                      onChange={updateConfig}
                      excludeKeys={["model", "prompt", "promptId"]}
                    />
                  </div>
                )}
              </div>
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
                <Textarea value={inputTemplateJson} onChange={(e) => handleTemplateChange(e.target.value)} placeholder='{"startUrls": "{{startUrls:urlObjects}}"}' className={`font-sans text-xs placeholder:text-xs bg-white ${templateError ? "border-brand focus-visible:ring-brand" : "border-slate-200"}`} rows={4} />
                {templateError && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{templateError}</p>}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100/60">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-650 transition-colors w-fit select-none cursor-pointer"
                >
                  {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  <span>Optional Parameters</span>
                </button>
                {showAdvanced && (
                  <div className="pt-2">
                    <DynamicConfigBuilder
                      label="Additional Parameters"
                      value={script.config}
                      onChange={updateConfig}
                      excludeKeys={["actorId", "inputTemplate"]}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {isCustom && (
            <div className={`space-y-3.5 border-l-2 pl-3.5 pb-2 ${
              pluginKey.startsWith("exportcomments") ? "border-violet-500" : "border-slate-400"
            }`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${
                  pluginKey.startsWith("exportcomments") ? "text-violet-600" : "text-slate-500"
                }`}>
                  <Terminal className="size-3.5 shrink-0" /><span>Plugin Configuration</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/40">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setRawJson(JSON.stringify(script.config, null, 2));
                      setEditMode("visual");
                    }}
                    className={`h-5 px-2 text-[9px] font-bold rounded-md transition-all ${
                      editMode === "visual"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-400 hover:text-slate-750"
                    }`}
                  >
                    Visual Builder
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setRawJson(JSON.stringify(script.config, null, 2));
                      setEditMode("raw");
                    }}
                    className={`h-5 px-2 text-[9px] font-bold rounded-md transition-all ${
                      editMode === "raw"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-400 hover:text-slate-750"
                    }`}
                  >
                    Raw JSON
                  </Button>
                </div>
              </div>

              {editMode === "visual" ? (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600 font-sans">Input Template (JSON)</Label>
                    <Textarea
                      value={inputTemplateJson}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      placeholder='{"url": "{{url}}"}'
                      className={`font-sans text-xs placeholder:text-xs bg-white ${
                        templateError ? "border-brand focus-visible:ring-brand" : "border-slate-200"
                      }`}
                      rows={4}
                    />
                    {templateError && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{templateError}</p>}
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100/60">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-650 transition-colors w-fit select-none cursor-pointer"
                    >
                      {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      <span>Optional Parameters</span>
                    </button>
                    {showAdvanced && (
                      <div className="pt-2">
                        <DynamicConfigBuilder
                          label="Additional Parameters"
                          value={script.config}
                          onChange={updateConfig}
                          excludeKeys={["inputTemplate"]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Textarea
                    value={rawJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder='{"key": "value"}'
                    className={`font-sans text-xs placeholder:text-xs bg-white ${
                      jsonError ? "border-brand focus-visible:ring-brand" : "border-slate-200"
                    }`}
                    rows={5}
                  />
                  {jsonError && <p className="text-[9px] text-brand font-semibold leading-none mt-1">{jsonError}</p>}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
