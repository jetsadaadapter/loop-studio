"use client";

import { ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";

type FeaturedImageSectionProps = {
  imageId: string;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (value: string) => void;
  onError: (message: string) => void;
};

export function FeaturedImageSection({
  imageId,
  touched,
  fieldErrors,
  onChange,
  onError,
}: FeaturedImageSectionProps) {
  return (
    <Card className="rounded-xl border border-slate-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ImageIcon className="size-4" />
          </div>
          <div>
            <h5 className="text-base font-semibold leading-tight">Featured Image</h5>
            <p className="text-xs text-muted-foreground">Wide banner displayed on the app detail page</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Field>
          <ImageUpload
            value={imageId}
            previewSrc={
              imageId
                ? `/images/${encodeURIComponent(imageId.trim())}`
                : undefined
            }
            onChange={onChange}
            onError={onError}
            placeholder="Upload featured image"
            description="Recommended size: 1200x400 px. Supports png, jpg, jpeg, webp."
          />
          <FieldError
            errors={touched.imageId ? [{ message: fieldErrors.imageId }] : []}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
