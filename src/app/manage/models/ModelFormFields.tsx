import { AIModelSchema } from "@/core/validators/models.validator";

export function validateModelForm(
  value: ModelFormFieldsDraft,
): Record<string, string> {
  const result = AIModelSchema.safeParse(value);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path[0] as string;
    errors[path] = issue.message;
  });

  return errors;
}
import { Input } from "@/components/ui/input";
import { ManagerFormSection } from "@/components/manager-form-section";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
              placeholder="e.g. gpt-4o"
              value={draft.modelSlug}
              onChange={(e) => {
                const val = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9.-]/g, "");
                onChange("modelSlug", val);
              }}
            />
            <FieldDescription>
              Unique identifier for the model. Use lowercase, kebab-case, or dots
              (e.g., gemini-3.5-flash).
            </FieldDescription>
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
              placeholder="e.g. GPT-4o"
              value={draft.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
            <FieldDescription>
              Display name for the model (e.g., GPT-4o).
            </FieldDescription>
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
              placeholder="e.g. OpenAI"
              value={draft.provider}
              onChange={(e) => onChange("provider", e.target.value)}
            />
            <FieldDescription>
              AI service provider (e.g. OpenAI, Anthropic, Google).
            </FieldDescription>
            <FieldError
              errors={
                fieldErrors.provider ? [{ message: fieldErrors.provider }] : []
              }
            />
          </Field>
        </div>
        <div className="col-span-12">
          <Field orientation="horizontal">
            <div className="flex items-center space-x-3">
              <Switch 
                id="model-active-switch"
                checked={draft.isActive} 
                onCheckedChange={(val) => onChange("isActive", val)} 
              />
              <Label htmlFor="model-active-switch" className="cursor-pointer">Active</Label>
            </div>
          </Field>
        </div>
        <div className="col-span-12">
          <Field orientation="horizontal">
            <div className="flex items-center space-x-3">
              <Switch 
                id="model-default-switch"
                checked={draft.isDefault} 
                onCheckedChange={(val) => onChange("isDefault", val)} 
              />
              <Label htmlFor="model-default-switch" className="cursor-pointer">Default</Label>
            </div>
          </Field>
        </div>
      </div>
    </ManagerFormSection>
  );
}
