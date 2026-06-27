import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ManagerFormSection } from "@/components/manager-form-section";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManageApiKeySchema } from "@/core/validators/keys.validator";
import React from "react";

export type ApiKeyFormFieldsDraft = {
  id: string;
  appId: string;
  name: string;
  webhookUrl: string;
  isActive: boolean;
  projectId: string;
};

export function validateApiKeyForm(
  value: ApiKeyFormFieldsDraft,
): Record<string, string> {
  const result = ManageApiKeySchema.safeParse({
    name: value.name,
    webhookUrl: value.webhookUrl,
    isActive: value.isActive,
    projectId: value.projectId || null,
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
  projects?: { id: string; name: string }[];
  onChange: (
    field: keyof ApiKeyFormFieldsDraft,
    value: string | boolean,
  ) => void;
}

export function KeyFormFields({
  draft,
  fieldErrors = {},
  projects = [],
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

        {/* Connected Project */}
        <div className="col-span-12">
          <Field>
            <FieldLabel>
              Connected Project
            </FieldLabel>
            <div className="flex gap-2 items-center">
              <Select
                value={draft.projectId || "none"}
                onValueChange={(val) => onChange("projectId", (val === "none" || !val) ? "" : val)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select project (Optional)">
                    {projects?.find((p) => p.id === draft.projectId)?.name || "Not connected"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="none">
                    <span className="text-xs text-slate-400 font-sans">Not connected</span>
                  </SelectItem>
                  {projects?.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <span className="text-xs font-sans">{proj.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {draft.projectId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange("projectId", "")}
                  className="shrink-0 text-xs text-red-500 hover:text-red-700 hover:bg-red-55/40 border-red-200 hover:border-red-300 font-sans h-8 px-2.5 rounded-md"
                >
                  Disconnect
                </Button>
              )}
            </div>
            <FieldDescription>
              Optionally connect this key to an existing project for tracking.
            </FieldDescription>
            <FieldError
              errors={fieldErrors.projectId ? [{ message: fieldErrors.projectId }] : []}
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
