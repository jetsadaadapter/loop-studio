"use client";

import { CheckCircle2, Eye, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";

type ContentSectionProps = {
  instructions: string;
  integration: string;
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
  onIntegrationPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onIntegrationMdInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onIntegrationPreviewClick: () => void;
  integrationMdInputRef: React.RefObject<HTMLInputElement | null>;
  onGenerateIntegration?: () => void;
  isGeneratingIntegration?: boolean;
};

export function ContentSection({
  instructions,
  integration,
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
  onIntegrationPaste,
  onIntegrationMdInputChange,
  onIntegrationPreviewClick,
  integrationMdInputRef,
  onGenerateIntegration,
  isGeneratingIntegration = false,
}: ContentSectionProps) {
  const hasinstructions = instructions.trim().length > 0;
  const hasIntegration = integration.trim().length > 0;

  return (
    <Card className="rounded-xl border border-slate-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <FileText className="size-4" />
          </div>
          <div>
            <h5 className="text-base font-semibold leading-tight">Content</h5>
            <p className="text-xs text-muted-foreground">Instructions, integration guide, and tags</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>
              Instructions <span className="text-destructive">*</span>
            </FieldLabel>
            {hasinstructions && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                <CheckCircle2 className="size-3" />
                Filled
              </span>
            )}
          </div>
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
            placeholder="Write instructions in Markdown..."
            value={instructions}
            onChange={(event) => onChange("instructions", event.target.value)}
            onPaste={onPaste}
            onBlur={() => onBlur("instructions")}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs placeholder:text-xs shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-(family-name:--font-inter)"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => instructionsMdInputRef.current?.click()}
            >
              Import .md
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreviewClick}
              className="flex items-center gap-1.5"
            >
              <Eye className="size-3.5" />
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
          <div className="flex items-center justify-between">
            <FieldLabel>Integration</FieldLabel>
            {hasIntegration && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                <CheckCircle2 className="size-3" />
                Filled
              </span>
            )}
          </div>
          <input
            ref={integrationMdInputRef}
            type="file"
            accept=".md,text/markdown"
            className="hidden"
            title="Import markdown integration"
            aria-label="Import markdown integration"
            onChange={onIntegrationMdInputChange}
          />
          <textarea
            placeholder="Write integration guide in Markdown..."
            value={integration}
            onChange={(event) => onChange("integration", event.target.value)}
            onPaste={onIntegrationPaste}
            onBlur={() => onBlur("integration")}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs placeholder:text-xs shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-(family-name:--font-inter)"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {onGenerateIntegration && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGenerateIntegration}
                disabled={isGeneratingIntegration}
                className="flex items-center gap-1.5 border-brand/40 text-brand hover:bg-brand/5"
              >
                <Sparkles className="size-3.5" />
                {isGeneratingIntegration ? "Generating…" : "Generate"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => integrationMdInputRef.current?.click()}
            >
              Import .md
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onIntegrationPreviewClick}
              className="flex items-center gap-1.5"
            >
              <Eye className="size-3.5" />
              Preview
            </Button>
            <span className="text-xs text-muted-foreground">
              Paste text, upload .md file, or preview.
            </span>
          </div>
          <FieldError
            errors={
              touched.integration ? [{ message: fieldErrors.integration }] : []
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
