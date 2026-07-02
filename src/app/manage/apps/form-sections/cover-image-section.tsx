"use client";

import { ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";

type CoverImageSectionProps = {
  coverId: string;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (value: string) => void;
  onError: (message: string) => void;
};

export function CoverImageSection({
  coverId,
  touched,
  fieldErrors,
  onChange,
  onError,
}: CoverImageSectionProps) {
  return (
    <Card className="rounded-xl border border-slate-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ImageIcon className="size-4" />
          </div>
          <div>
            <h5 className="text-base font-semibold leading-tight">Cover Image</h5>
            <p className="text-xs text-muted-foreground">Wide banner displayed on the app detail page</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Field>
          <ImageUpload
            value={coverId}
            previewSrc={
              coverId
                ? `/images/${encodeURIComponent(coverId.trim())}`
                : undefined
            }
            previewFit="cover"
            expectedWidth={1200}
            expectedHeight={400}
            onChange={onChange}
            onError={onError}
            placeholder="Upload cover image"
            description="Recommended size: 1200x400 px. Supports png, jpg, jpeg, webp."
          />
          <FieldError
            errors={touched.coverId ? [{ message: fieldErrors.coverId }] : []}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
