"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppLinkType } from "@/core/interfaces/apps.interface";

type ActionSectionProps = {
  linkType: AppLinkType;
  ctaLabel: string;
  ctaLink: string;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
};

export function ActionSection({
  linkType,
  ctaLabel,
  ctaLink,
  touched,
  fieldErrors,
  onChange,
  onBlur,
}: ActionSectionProps) {
  return (
    <Card className="rounded-xl border-0">
      <CardHeader>
        <h5 className="text-base font-semibold">Action</h5>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>
            Link Type <span className="text-destructive">*</span>
          </FieldLabel>
          <Select
            value={linkType}
            onValueChange={(value) => onChange("linkType", value || "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="internal">internal</SelectItem>
              <SelectItem value="external">external</SelectItem>
              <SelectItem value="instruction">instruction</SelectItem>
            </SelectContent>
          </Select>
          <FieldError
            errors={
              touched.linkType ? [{ message: fieldErrors.linkType }] : []
            }
          />
        </Field>

        {linkType !== "instruction" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                CTA Label <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                placeholder="CTA label"
                value={ctaLabel}
                onChange={(e) => onChange("ctaLabel", e.target.value)}
                onBlur={() => onBlur("ctaLabel")}
              />
              {!(touched.ctaLabel && fieldErrors.ctaLabel) && (
                <FieldDescription>
                  The text displayed on the CTA button (maximum 30 characters).
                </FieldDescription>
              )}
              <FieldError
                errors={
                  touched.ctaLabel ? [{ message: fieldErrors.ctaLabel }] : []
                }
              />
            </Field>

            <Field>
              <FieldLabel>
                CTA Link <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                placeholder="CTA link"
                value={ctaLink}
                onChange={(e) => onChange("ctaLink", e.target.value)}
                onBlur={() => onBlur("ctaLink")}
              />
              <FieldDescription>
                Internal should start with /, external with https://.
                {!(touched.ctaLink && fieldErrors.ctaLink) && (
                  <>
                    <br />
                    <span className="text-amber-600 font-medium flex gap-1 mt-1">
                      ⚠️ If linking to a Tool, please use the exact Tool ID (e.g., /tool/01KRG...) instead of a slug to prevent 404 errors.
                    </span>
                  </>
                )}
              </FieldDescription>
              <FieldError
                errors={
                  touched.ctaLink ? [{ message: fieldErrors.ctaLink }] : []
                }
              />
            </Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
