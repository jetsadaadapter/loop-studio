"use client";

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
    <Card className="rounded-xl border-0">
      <CardHeader>
        <h5 className="text-base font-semibold">Featured Image</h5>
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
