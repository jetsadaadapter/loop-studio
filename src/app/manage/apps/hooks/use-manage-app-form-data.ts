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
import type { ManageAppPayload } from "@/core/interfaces/apps.interface";
import type { ManageTagListResponse } from "@/core/interfaces/tags.interface";
import { createManageApp, getManageApps, updateManageApp } from "@/core/services/apps.service";
import {
  importMarkdownFile,
  handleCopyInstructions,
  handleDownloadMarkdown,
} from "./instructions-helpers";

export function useManageAppFormData(mode: "create" | "edit", appId?: string) {
  const router = useRouter();
  const { pushDialogToast } = useDialogToast();

  const [draft, setDraft] = useState<AppRecord>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagNameToId, setTagNameToId] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [originalMediaIds, setOriginalMediaIds] = useState<{ imageId: string; iconId: string; coverId: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [didCopy, setDidCopy] = useState(false);

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
    await importMarkdownFile(markdownFile, touch, setFieldErrors, applyInstructionsContent);
  }

  async function handleInstructionsMdInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await importMarkdownFile(file, touch, setFieldErrors, applyInstructionsContent);
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
        const apps = await getManageApps();
        if (cancelled) return;

        const record = apps.map(mapApiItemToRecord).find((item) => item.id === appId.trim());
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
        const apps = await getManageApps();
        if (cancelled) return;

        const maxSortOrder = apps.reduce((currentMax, item) => {
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

  useEffect(() => {
    let cancelled = false;

    async function loadManageTags() {
      try {
        const response = await fetch("/api/manage/tags", { method: "GET", credentials: "include", cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as ManageTagListResponse;
        const tags = Array.isArray(payload.data) ? payload.data : [];
        if (cancelled) return;

        setTagSuggestions(tags.map((tag) => tag.name).filter(Boolean));
        setTagNameToId(
          Object.fromEntries(
            tags.filter((tag) => tag.name && tag.id).map((tag) => [tag.name.trim().toLowerCase(), tag.id]),
          ),
        );
      } catch {
        if (!cancelled) {
          setTagSuggestions([]);
          setTagNameToId({});
        }
      }
    }

    void loadManageTags();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/manage/categories", { method: "GET", credentials: "include", cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json();
        const data = Array.isArray(payload.data) ? payload.data : [];
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

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

      if (mode === "edit" && appId) {
        await updateManageApp(appId, payload);
        pushDialogToast("App updated successfully.", "success");
      } else {
        await createManageApp(payload);
        pushDialogToast("App created successfully.", "success");
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

  return {
    draft,
    setDraft,
    isLoading,
    isSubmitting,
    error,
    fieldErrors,
    touched,
    tagSuggestions,
    categories,
    showPreview,
    setShowPreview,
    didCopy,
    touch,
    touchAndValidate,
    handleInstructionsPaste,
    handleInstructionsMdInputChange,
    handleCopyInstructions: () => handleCopyInstructions(draft.instructions, pushDialogToast, setDidCopy),
    handleDownloadMarkdown: () => handleDownloadMarkdown(draft.instructions, draft.name, pushDialogToast),
    handleSubmit,
    handleFieldChange,
  };
}
