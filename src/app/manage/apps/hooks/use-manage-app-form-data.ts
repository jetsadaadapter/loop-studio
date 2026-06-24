"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDialogToast } from "@/components/ui/alert-dialog-toast";
import type { AppRecord } from "../manage-app-form-utils";
import {
  EMPTY_FORM,
  buildImageRemovePayload,
  mapApiItemToRecord,
  mapRecordToPayload,
  parseApiFieldErrors,
  validateAppForm,
} from "../manage-app-form-utils";
import type { ManageAppPayload, ManageAppApiItem } from "@/core/interfaces/apps.interface";
import { attachToolToApp, createManageApp, detachToolFromApp, getManageApps, updateManageApp } from "@/core/services/apps.service";
import {
  importMarkdownFile,
  handleCopyInstructions,
  handleDownloadMarkdown,
  handleCopyIntegration,
  handleDownloadIntegrationMarkdown,
} from "./instructions-helpers";
import { useTagsAndCategories } from "./use-tags-and-categories";
import { getManageTool } from "@/core/services/manage-tools.service";
import { generateIntegrationGuide } from "../integration-guide-generator";
import { getManageApiKeysResponse } from "@/core/services/keys.service";

export function useManageAppFormData(mode: "create" | "edit", appId?: string) {
  const router = useRouter();
  const { pushDialogToast } = useDialogToast();

  const [draft, setDraft] = useState<AppRecord>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const { tagSuggestions, tagNameToId, categories } = useTagsAndCategories();
  const [originalMediaIds, setOriginalMediaIds] = useState<{ imageId: string; iconId: string; coverId: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [didCopy, setDidCopy] = useState(false);
  const [showIntegrationPreview, setShowIntegrationPreview] = useState(false);
  const [didCopyIntegration, setDidCopyIntegration] = useState(false);
  const [isGeneratingIntegration, setIsGeneratingIntegration] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function revalidateField(field: string, nextDraft: AppRecord) {
    const allErrors = validateAppForm(nextDraft);
    setFieldErrors((prev) => ({ ...prev, [field]: allErrors[field] ?? "" }));
  }

  function touchAndValidate(field: string, nextDraft: AppRecord) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const allErrors = validateAppForm(nextDraft);
    setFieldErrors((prev) => ({ ...prev, [field]: allErrors[field] ?? "" }));
  }

  function applyInstructionsContent(incomingContent: string) {
    const normalized = incomingContent.replace(/\r\n/g, "\n").trim();
    const merged = draft.instructions.trim()
      ? `${draft.instructions.trimEnd()}\n\n${normalized}`
      : normalized;

    const next = { ...draft, instructions: merged };
    setDraft(next);
    touchAndValidate("instructions", next);
  }

  async function handleInstructionsPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const markdownFile = Array.from(event.clipboardData.files).find((file) => /\.md$/i.test(file.name));
    if (!markdownFile) return;
    event.preventDefault();
    await importMarkdownFile(markdownFile, "instructions", touch, setFieldErrors, applyInstructionsContent);
  }

  async function handleInstructionsMdInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await importMarkdownFile(file, "instructions", touch, setFieldErrors, applyInstructionsContent);
    event.target.value = "";
  }

  function applyIntegrationContent(incomingContent: string) {
    const normalized = incomingContent.replace(/\r\n/g, "\n").trim();
    const merged = draft.integration.trim()
      ? `${draft.integration.trimEnd()}\n\n${normalized}`
      : normalized;

    const next = { ...draft, integration: merged };
    setDraft(next);
    touchAndValidate("integration", next);
  }

  async function handleIntegrationPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const markdownFile = Array.from(event.clipboardData.files).find((file) => /\.md$/i.test(file.name));
    if (!markdownFile) return;
    event.preventDefault();
    await importMarkdownFile(markdownFile, "integration", touch, setFieldErrors, applyIntegrationContent);
  }

  async function handleIntegrationMdInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await importMarkdownFile(file, "integration", touch, setFieldErrors, applyIntegrationContent);
    event.target.value = "";
  }

  useEffect(() => {
    if (mode !== "edit") return;
    let cancelled = false;

    async function loadEditData() {
      if (!appId?.trim()) {
        if (!cancelled) {
          setError("Missing app id.");
          setIsLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
        setError("");
      }

      try {
        const appsPage = await getManageApps({ page: 1, limit: 1000 });
        if (cancelled) return;

        const record = (appsPage.data ?? []).map(mapApiItemToRecord).find((item: AppRecord) => item.id === appId.trim());
        if (!record) {
          setError("App not found.");
          return;
        }

        setDraft(record);
        setOriginalMediaIds({ imageId: record.imageId, iconId: record.iconId, coverId: record.coverId });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load app details.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadEditData();
    return () => {
      cancelled = true;
    };
  }, [appId, mode]);

  useEffect(() => {
    if (mode !== "create") return;
    let cancelled = false;

    async function loadNextSortOrder() {
      try {
        const appsPage = await getManageApps({ page: 1, limit: 1000 });
        if (cancelled) return;

        const maxSortOrder = (appsPage.data ?? []).reduce((currentMax: number, item: ManageAppApiItem) => {
          return Number.isInteger(item.sortOrder) ? Math.max(currentMax, item.sortOrder) : currentMax;
        }, -1);

        setDraft((current) => ({ ...current, sortOrder: Math.max(0, maxSortOrder + 1) }));
      } catch {
        // Keep default sort order
      }
    }

    void loadNextSortOrder();
    return () => {
      cancelled = true;
    };
  }, [mode]);


  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const nextErrors = validateAppForm(draft);
    const allFields = Object.keys(EMPTY_FORM) as (keyof AppRecord)[];
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])));

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setIsSubmitting(false);
      return;
    }

    setFieldErrors({});

    try {
      const payload: ManageAppPayload = {
        ...mapRecordToPayload(draft),
        tags: draft.tags.map((tag) => tagNameToId[tag.trim().toLowerCase()] ?? tag).filter(Boolean),
      };

      if (mode === "edit" && originalMediaIds) {
        const imageRemove = buildImageRemovePayload(
          { imageId: draft.imageId, iconId: draft.iconId, coverId: draft.coverId },
          originalMediaIds,
        );
        if (imageRemove) payload.imageRemove = imageRemove;
      }

      let savedAppId = appId;
      if (mode === "edit" && appId) {
        await updateManageApp(appId, payload);
        pushDialogToast("App updated successfully.", "success");
      } else {
        const created = await createManageApp(payload);
        savedAppId = created.id;
        pushDialogToast("App created successfully.", "success");
      }

      // Auto-attach tool when linkType=internal and ctaLink points to a tool
      if (savedAppId && draft.linkType === "internal" && draft.ctaLink?.startsWith("/tool/")) {
        const toolId = draft.ctaLink.replace("/tool/", "").trim();
        if (toolId) {
          try {
            await attachToolToApp(savedAppId, toolId);
          } catch (attachErr) {
            // 409 = already attached, that's fine. Other errors are non-fatal (app was saved).
            if ((attachErr as { status?: number }).status !== 409) {
              console.warn("[attachTool] non-fatal attach error:", attachErr);
            }
          }
        }
      }

      // Auto-detach when linkType changed away from internal
      if (mode === "edit" && appId && draft.linkType !== "internal") {
        try {
          // Fetch current app to get appTool id if any
          const pages = await getManageApps({ page: 1, limit: 1000 });
          const current = (pages.data ?? []).find((a) => a.id === appId);
          if (current?.appTool?.tool?.id) {
            await detachToolFromApp(appId, current.appTool.tool.id);
          }
        } catch {
          // Detach failure is non-fatal
        }
      }

      router.push("/manage/apps");
      router.refresh();
    } catch (submitError) {
      const apiFieldErrors = parseApiFieldErrors(submitError);
      if (Object.keys(apiFieldErrors).length > 0) setFieldErrors(apiFieldErrors);

      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "edit"
            ? "Failed to update app."
            : "Failed to create app.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFieldChange(field: string, value: string | string[]) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (touched[field]) revalidateField(field, next);
  }

  async function handleGenerateIntegration() {
    const ctaLink = draft.ctaLink ?? "";
    const toolId = ctaLink.startsWith("/tool/") ? ctaLink.replace("/tool/", "").trim() : "";
    if (!toolId) return;
    setGenerateSuccess(false);
    setIsGeneratingIntegration(true);
    try {
      const [tool, keysResp] = await Promise.all([
        getManageTool(toolId),
        getManageApiKeysResponse(1, 10).catch(() => null),
      ]);
      const existingWebhookUrl = (keysResp as { data?: Array<{ isActive?: boolean; webhookUrl?: string }> } | null)
        ?.data?.find((k) => k.isActive && k.webhookUrl?.trim())
        ?.webhookUrl?.trim() ?? undefined;
      const guide = generateIntegrationGuide(toolId, draft.name || tool.name, tool.scripts ?? [], tool.params ?? [], existingWebhookUrl);
      setDraft((prev) => ({ ...prev, integration: guide }));
      setGenerateSuccess(true);
    } catch {
      pushDialogToast("Failed to fetch tool data. Make sure the Tool ID is correct.", "error");
    } finally {
      setIsGeneratingIntegration(false);
    }
  }

  return {
    draft,
    setDraft,
    isLoading,
    isSubmitting,
    error,
    fieldErrors,
    setFieldErrors,
    touched,
    tagSuggestions,
    categories,
    showPreview,
    setShowPreview,
    didCopy,
    showIntegrationPreview,
    setShowIntegrationPreview,
    didCopyIntegration,
    touch,
    touchAndValidate,
    handleInstructionsPaste,
    handleInstructionsMdInputChange,
    handleCopyInstructions: () => handleCopyInstructions(draft.instructions, pushDialogToast, setDidCopy),
    handleDownloadMarkdown: () => handleDownloadMarkdown(draft.instructions, draft.name, pushDialogToast),
    handleIntegrationPaste,
    handleIntegrationMdInputChange,
    handleCopyIntegration: () => handleCopyIntegration(draft.integration, pushDialogToast, setDidCopyIntegration),
    handleDownloadIntegration: () => handleDownloadIntegrationMarkdown(draft.integration, draft.name, pushDialogToast),
    handleSubmit,
    handleFieldChange,
    handleGenerateIntegration,
    isGeneratingIntegration,
    generateSuccess,
  };
}
