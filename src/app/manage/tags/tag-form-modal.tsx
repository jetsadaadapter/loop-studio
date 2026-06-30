"use client";

import { useEffect, useRef, useState } from "react";
import { X, Tag, Loader2 } from "lucide-react";
import { ManageTagSchema } from "@/core/validators/tags.validator";
import type { ManageTagFormValues } from "@/core/validators/tags.validator";
import type { ManageTagApiItem } from "@/core/interfaces/tags.interface";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import styles from "./tag-form-modal.module.css";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TagFormModalProps {
  mode: "create" | "edit";
  initialValues?: ManageTagApiItem;
  isSubmitting: boolean;
  submitError: string;
  onSubmit: (values: ManageTagFormValues) => void;
  onClose: () => void;
}

const DEFAULT_COLOR = "#6366f1";

const COLOR_SWATCHES = [
  "#6366f1", "#a78bfa", "#7c3aed", "#c084fc",
  "#3b82f6", "#93c5fd", "#38bdf8", "#67e8f9",
  "#16a34a", "#86efac", "#f59e0b", "#fcd34d",
  "#e11d48", "#fda4af", "#dc2626", "#fca5a5",
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TagFormModal({
  mode,
  initialValues,
  isSubmitting,
  submitError,
  onSubmit,
  onClose,
}: TagFormModalProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [color, setColor] = useState(
    initialValues?.color && initialValues.color !== "" ? initialValues.color : DEFAULT_COLOR,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ManageTagFormValues, string>>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function validate(): ManageTagFormValues | null {
    const result = ManageTagSchema.safeParse({ name: name.trim(), color });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ManageTagFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ManageTagFormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }
    setErrors({});
    return result.data;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = validate();
    if (!values) return;
    onSubmit(values);
  }

  const isEdit = mode === "edit";

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideCloseButton className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex size-7 items-center justify-center rounded-lg ${
                color ? styles.tagIconActive : styles.tagIconFallback
              }`}
            >
              <Tag className="size-3.5 text-white drop-shadow-sm" />
            </span>
            <h2 className="text-sm font-semibold text-slate-800">
              {isEdit ? "Edit Tag" : "Create Tag"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            title="Close modal"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Tag Name */}
          <Field>
            <FieldLabel>
              Tag Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              ref={nameInputRef}
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MCP, Tool, Finance"
              maxLength={50}
            />
            <FieldDescription>
              Name of the tag used to categorize apps and content.
            </FieldDescription>
            <FieldError
              errors={errors.name ? [{ message: errors.name }] : []}
            />
          </Field>

          {/* Color */}
          <Field>
            <FieldLabel>
              Color <span className="text-slate-400 font-normal font-sans">(optional)</span>
            </FieldLabel>
            {/* Swatch row */}
            <div className="flex items-center overflow-x-auto pb-0.5">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = color.toLowerCase() === swatch.toLowerCase();
                return (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    title={swatch}
                    className="relative shrink-0 focus:outline-none"
                  style={{ width: isSelected ? 28 : 24, height: isSelected ? 28 : 24 }}
                >
                    {isSelected ? (
                      <span className="flex h-full w-full items-center justify-center rounded-lg border-2 border-slate-200 bg-white shadow-sm">
                        <span className="flex size-4 items-center justify-center rounded-full" style={{ backgroundColor: swatch }}>
                          <svg className="size-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                      </span>
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <span className="block size-4 rounded-full transition-transform duration-150 hover:scale-110" style={{ backgroundColor: swatch }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Custom hex input */}
            <div className="mt-2 flex items-center gap-2">
              <div className="size-7 shrink-0 rounded-md border border-slate-200 shadow-xs" style={{ backgroundColor: color }} />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                maxLength={7}
                className="font-sans text-xs"
              />
            </div>
            <FieldError
              errors={errors.color ? [{ message: errors.color }] : []}
            />
          </Field>

          {/* Submit error */}
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100">
              {submitError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id={isEdit ? "tag-modal-update-btn" : "tag-modal-create-btn"}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              {isEdit ? "Update Tag" : "Create Tag"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
