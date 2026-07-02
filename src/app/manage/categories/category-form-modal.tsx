"use client";

import { useEffect, useRef, useState } from "react";
import { X, FolderOpen, Loader2 } from "lucide-react";
import { ManageCategorySchema } from "@/core/validators/categories.validator";
import type { ManageCategoryFormValues } from "@/core/validators/categories.validator";
import type { CategoryInfo } from "@/core/interfaces/categories.interface";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import styles from "./category-form-modal.module.css";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

interface CategoryFormModalProps {
  mode: "create" | "edit";
  initialValues?: CategoryInfo;
  isSubmitting: boolean;
  submitError: string;
  onSubmit: (values: ManageCategoryFormValues) => void;
  onClose: () => void;
}

export function CategoryFormModal({
  mode,
  initialValues,
  isSubmitting,
  submitError,
  onSubmit,
  onClose,
}: CategoryFormModalProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof ManageCategoryFormValues, string>>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function validate(): ManageCategoryFormValues | null {
    const result = ManageCategorySchema.safeParse({ name: name.trim() });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ManageCategoryFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ManageCategoryFormValues;
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
              className={`flex size-7 items-center justify-center rounded-lg ${styles.categoryIconActive}`}
            >
              <FolderOpen className="size-3.5 text-white drop-shadow-sm" />
            </span>
            <h2 className="text-sm font-semibold text-slate-800">
              {isEdit ? "Edit Category" : "Create Category"}
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
          {/* Category Name */}
          <Field>
            <FieldLabel>
              Category Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              ref={nameInputRef}
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tool, MCP, Analytics"
              maxLength={50}
            />
            <FieldDescription>
              Name of the category used to group apps.
            </FieldDescription>
            <FieldError
              errors={errors.name ? [{ message: errors.name }] : []}
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
              id={isEdit ? "category-modal-update-btn" : "category-modal-create-btn"}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              {isEdit ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
