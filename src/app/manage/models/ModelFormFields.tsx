// Validate all fields for the model form, similar to manage apps
export function validateModelForm(
  value: ModelFormFieldsDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!value.modelSlug.trim()) errors.modelSlug = "Model slug is required.";
  if (!value.name.trim()) errors.name = "Name is required.";
  if (!value.provider.trim()) errors.provider = "Provider is required.";

  // Example: add more rules as needed
  if (value.modelSlug && value.modelSlug.length < 3) {
    errors.modelSlug = "Model slug must be at least 3 characters.";
  }
  if (value.name && value.name.length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }

  return errors;
}
import { Input } from "@/components/ui/input";
import { ManagerFormSection } from "@/components/manager-form-section";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import React from "react";

export interface ModelFormFieldsDraft {
  modelSlug: string;
  name: string;
  provider: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface ModelFormFieldsProps {
  draft: ModelFormFieldsDraft;
  fieldErrors?: Record<string, string>;
  onChange: (
    field: keyof ModelFormFieldsDraft,
    value: string | boolean,
  ) => void;
}

export function ModelFormFields({
  draft,
  fieldErrors = {},
  onChange,
}: ModelFormFieldsProps) {
  return (
    <ManagerFormSection title="Model">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <Field>
            <FieldLabel>
              Model Slug <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              placeholder="Model Slug"
              value={draft.modelSlug}
              onChange={(e) => onChange("modelSlug", e.target.value)}
            />
            <FieldError
              errors={
                fieldErrors.modelSlug
                  ? [{ message: fieldErrors.modelSlug }]
                  : []
              }
            />
          </Field>
        </div>
        <div className="col-span-12">
          <Field>
            <FieldLabel>
              Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              placeholder="Name"
              value={draft.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
            <FieldError
              errors={fieldErrors.name ? [{ message: fieldErrors.name }] : []}
            />
          </Field>
        </div>
        <div className="col-span-12">
          <Field>
            <FieldLabel>
              Provider <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              placeholder="Provider"
              value={draft.provider}
              onChange={(e) => onChange("provider", e.target.value)}
            />
            <FieldError
              errors={
                fieldErrors.provider ? [{ message: fieldErrors.provider }] : []
              }
            />
          </Field>
        </div>
        <div className="col-span-12">
          <Field orientation="horizontal">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => onChange("isActive", e.target.checked)}
                className="sr-only peer"
                // aria-checked removed: not needed for native input
                tabIndex={0}
                title="Active"
              />
              <span
                aria-hidden="true"
                className={
                  "inline-flex h-4 w-4 items-center justify-center rounded border border-input transition-colors " +
                  (draft.isActive
                    ? "bg-black border-black"
                    : "bg-background border-input text-muted-foreground")
                }
              >
                {draft.isActive ? (
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="4 8.5 7 11.5 12 6.5" />
                  </svg>
                ) : null}
              </span>
              <span className="text-sm">Active</span>
            </label>
          </Field>
        </div>
        <div className="col-span-12">
          <Field orientation="horizontal">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draft.isDefault}
                onChange={(e) => onChange("isDefault", e.target.checked)}
                className="sr-only peer"
                // aria-checked removed: not needed for native input
                tabIndex={0}
                title="Default"
              />
              <span
                aria-hidden="true"
                className={
                  "inline-flex h-4 w-4 items-center justify-center rounded border border-input transition-colors " +
                  (draft.isDefault
                    ? "bg-black border-black"
                    : "bg-background border-input text-muted-foreground")
                }
              >
                {draft.isDefault ? (
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="4 8.5 7 11.5 12 6.5" />
                  </svg>
                ) : null}
              </span>
              <span className="text-sm">Default</span>
            </label>
          </Field>
        </div>
      </div>
    </ManagerFormSection>
  );
}
