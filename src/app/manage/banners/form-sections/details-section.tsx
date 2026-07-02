"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type DetailsSectionProps = {
  title: string;
  subtitle: string;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (field: "title" | "subtitle", value: string) => void;
  onBlur: (field: string) => void;
};

export function DetailsSection({
  title,
  subtitle,
  touched,
  fieldErrors,
  onChange,
  onBlur,
}: DetailsSectionProps) {
  return (
    <Card className="rounded-xl border border-slate-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <FileText className="size-4" />
          </div>
          <div>
            <h5 className="text-base font-semibold leading-tight">Banner Details</h5>
            <p className="text-xs text-muted-foreground">Headline and supporting text</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>Title <span className="text-destructive">*</span></FieldLabel>
          <Input
            value={title}
            placeholder="Banner title"
            onChange={(e) => onChange("title", e.target.value)}
            onBlur={() => onBlur("title")}
          />
          {!(touched.title && fieldErrors.title) && (
            <FieldDescription>The main headline displayed on the banner.</FieldDescription>
          )}
          <FieldError errors={touched.title ? [{ message: fieldErrors.title }] : []} />
        </Field>

        <Field>
          <FieldLabel>Subtitle <span className="text-destructive">*</span></FieldLabel>
          <Input
            value={subtitle}
            placeholder="Banner subtitle"
            onChange={(e) => onChange("subtitle", e.target.value)}
            onBlur={() => onBlur("subtitle")}
          />
          {!(touched.subtitle && fieldErrors.subtitle) && (
            <FieldDescription>Supporting text or call-to-action below the title.</FieldDescription>
          )}
          <FieldError errors={touched.subtitle ? [{ message: fieldErrors.subtitle }] : []} />
        </Field>
      </CardContent>
    </Card>
  );
}
