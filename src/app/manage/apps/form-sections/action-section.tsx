"use client";

import { MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToolSelector } from "@/components/manager-form/tool-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppLinkType } from "@/core/interfaces/apps.interface";
import { useRef, useEffect } from "react";

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
  const prevLinkType = useRef<AppLinkType | undefined>(linkType);
  // Preserve last-used ctaLink per type so switching back restores it
  const savedLinks = useRef<Partial<Record<AppLinkType, string>>>({});

  useEffect(() => {
    const prev = prevLinkType.current;
    if (prev !== linkType) {
      // Save current ctaLink under the old type before switching
      if (prev) savedLinks.current[prev] = ctaLink;
      // Restore saved value for the new type (or empty string)
      onChange("ctaLink", savedLinks.current[linkType] ?? "");
      prevLinkType.current = linkType;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkType]);

  return (
    <Card className="rounded-xl border border-slate-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <MousePointerClick className="size-4" />
          </div>
          <div>
            <h5 className="text-base font-semibold leading-tight">Action</h5>
            <p className="text-xs text-muted-foreground">CTA button link and label configuration</p>
          </div>
        </div>
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
              <SelectItem value="internal">
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className="text-xs font-medium leading-snug">Internal</span>
                  <span className="text-[10px] text-muted-foreground leading-snug">Link to a page within this app</span>
                </div>
              </SelectItem>
              <SelectItem value="external">
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className="text-xs font-medium leading-snug">External</span>
                  <span className="text-[10px] text-muted-foreground leading-snug">Link to an outside URL</span>
                </div>
              </SelectItem>
              <SelectItem value="instruction">
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className="text-xs font-medium leading-snug">Instruction</span>
                  <span className="text-[10px] text-muted-foreground leading-snug">No link, show instructions only</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError
            errors={touched.linkType ? [{ message: fieldErrors.linkType }] : []}
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

            {linkType === "internal" ? (
              <ToolSelector
                value={ctaLink.replace("/tool/", "")}
                onChange={(toolId) => onChange("ctaLink", `/tool/${toolId}`)}
                touched={touched.ctaLink}
                error={fieldErrors.ctaLink}
              />
            ) : (
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
                  {linkType === "external" ? (
                    "External links must start with https:// (e.g., https://yourdomain.com/page)."
                  ) : (
                    <>
                      Internal should start with / (e.g., /about, /apps,
                      /tool/01KRG...).
                      {!(touched.ctaLink && fieldErrors.ctaLink) && (
                        <>
                          <br />
                          <span className="text-amber-600 font-medium flex gap-1 mt-1">
                            ⚠️ If linking to a Tool, please use the exact Tool
                            ID (e.g., /tool/01KRG...) instead of a slug to
                            prevent 404 errors.
                          </span>
                        </>
                      )}
                    </>
                  )}
                </FieldDescription>
                <FieldError
                  errors={
                    touched.ctaLink ? [{ message: fieldErrors.ctaLink }] : []
                  }
                />
              </Field>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
