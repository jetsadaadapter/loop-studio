"use client";

import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";

type ContentSectionProps = {
  instructions: string;
  tags: string[];
  tagSuggestions: string[];
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (field: string, value: string | string[]) => void;
  onBlur: (field: string) => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onMdInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPreviewClick: () => void;
  instructionsMdInputRef: React.RefObject<HTMLInputElement | null>;
};

export function ContentSection({
  instructions,
  tags,
  tagSuggestions,
  touched,
  fieldErrors,
  onChange,
  onBlur,
  onPaste,
  onMdInputChange,
  onPreviewClick,
  instructionsMdInputRef,
}: ContentSectionProps) {
  return (
    <Card className="rounded-xl border-0">
      <CardHeader>
        <h5 className="text-base font-semibold">Content</h5>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>
            Instructions <span className="text-destructive">*</span>
          </FieldLabel>
          <input
            ref={instructionsMdInputRef}
            type="file"
            accept=".md,text/markdown"
            className="hidden"
            title="Import markdown instructions"
            aria-label="Import markdown instructions"
            onChange={onMdInputChange}
          />
          <textarea
            placeholder="Instructions (supports Markdown)"
            value={instructions}
            onChange={(event) => onChange("instructions", event.target.value)}
            onPaste={onPaste}
            onBlur={() => onBlur("instructions")}
            rows={12}
            className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-(family-name:--font-inter)"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => instructionsMdInputRef.current?.click()}
            >
              Import .md
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onPreviewClick}
              className="flex items-center gap-1.5"
            >
              <Eye className="size-4" />
              Preview
            </Button>
            <span className="text-xs text-muted-foreground">
              Paste text, upload .md file, or preview.
            </span>
          </div>
          <FieldError
            errors={
              touched.instructions ? [{ message: fieldErrors.instructions }] : []
            }
          />
        </Field>

        <Field>
          <FieldLabel>
            Tags <span className="text-destructive">*</span>
          </FieldLabel>
          <TagInput
            value={tags}
            suggestions={tagSuggestions}
            strictSuggestions
            helperText="Add tags for app."
            onChange={(newTags) => onChange("tags", newTags)}
            placeholder="Add tags..."
          />
          <FieldError
            errors={touched.tags ? [{ message: fieldErrors.tags }] : []}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
