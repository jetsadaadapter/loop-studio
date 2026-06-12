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
import { ManageApiKeySchema } from "@/core/validators/keys.validator";
import React from "react";

export type ApiKeyFormFieldsDraft = {
  id: string;
  appId: string;
  name: string;
  webhookUrl: string;
  isActive: boolean;
};

export function validateApiKeyForm(
  value: ApiKeyFormFieldsDraft,
): Record<string, string> {
  const result = ManageApiKeySchema.safeParse({
    name: value.name,
    webhookUrl: value.webhookUrl,
    isActive: value.isActive,
  });
  if (result.success) return {};

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path[0] as string;
    errors[path] = issue.message;
  });

  return errors;
}

export interface KeyFormFieldsProps {
  draft: ApiKeyFormFieldsDraft;
  fieldErrors?: Record<string, string>;
  onChange: (
    field: keyof ApiKeyFormFieldsDraft,
    value: string | boolean,
  ) => void;
}

export function KeyFormFields({
  draft,
  fieldErrors = {},
  onChange,
}: KeyFormFieldsProps) {
  return (
    <ManagerFormSection title="API Key Information">
      <div className="grid grid-cols-12 gap-4">
        {/* Key Name */}
        <div className="col-span-12">
          <Field>
            <FieldLabel>
              Key Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              placeholder="e.g. My Application Key"
              value={draft.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="font-sans"
            />
            <FieldDescription>
              Descriptive name to identify where this key is being used.
            </FieldDescription>
            <FieldError
              errors={fieldErrors.name ? [{ message: fieldErrors.name }] : []}
            />
          </Field>
        </div>

        {/* Webhook URL */}
        <div className="col-span-12">
          <Field>
            <FieldLabel>
              Webhook URL
            </FieldLabel>
            <Input
              placeholder="e.g. https://webhook.site/..."
              value={draft.webhookUrl}
              onChange={(e) => onChange("webhookUrl", e.target.value)}
              className="font-sans"
            />
            <FieldDescription>
              Optional endpoint where real-time application event notifications will be dispatched.
            </FieldDescription>
            <FieldError
              errors={fieldErrors.webhookUrl ? [{ message: fieldErrors.webhookUrl }] : []}
            />
          </Field>
        </div>

        {/* Active Status */}
        <div className="col-span-12">
          <Field orientation="horizontal">
            <div className="flex items-center space-x-3">
              <Switch
                id="key-active-switch"
                checked={draft.isActive}
                onCheckedChange={(val) => onChange("isActive", val)}
              />
              <Label htmlFor="key-active-switch" className="cursor-pointer font-sans text-xs font-semibold text-slate-700">
                Active
              </Label>
            </div>
          </Field>
          <p className="text-[10px] text-slate-450 mt-1 select-none font-sans">
            Inactive keys will reject all incoming API requests immediately.
          </p>
        </div>
      </div>
    </ManagerFormSection>
  );
}
