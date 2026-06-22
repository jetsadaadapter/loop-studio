"use client";

import { CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { PromptEditor } from "@/app/manage/tools/components/prompt-editor";

type ContentSectionProps = {
  instructions: string;
  integration: string;
  tags: string[];
  tagSuggestions: string[];
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (field: string, value: string | string[]) => void;
  onBlur: (field: string) => void;
  // kept for backward compat — no longer used (PromptEditor handles these internally)
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onMdInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPreviewClick?: () => void;
  instructionsMdInputRef?: React.RefObject<HTMLInputElement | null>;
  onIntegrationPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onIntegrationMdInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onIntegrationPreviewClick?: () => void;
  integrationMdInputRef?: React.RefObject<HTMLInputElement | null>;
  onGenerateIntegration?: () => void;
  isGeneratingIntegration?: boolean;
  isInternal?: boolean;
  hasToolId?: boolean;
  generateSuccess?: boolean;
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
  onGenerateIntegration,
  isGeneratingIntegration = false,
  isInternal = false,
  hasToolId = false,
  generateSuccess = false,
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

        {/* Instructions */}
        <Field>
          <div className="flex items-center justify-between mb-1">
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
          <PromptEditor
            value={instructions}
            onChange={(val) => onChange("instructions", val)}
            placeholder="Write instructions in Markdown…"
            hasError={!!(touched.instructions && fieldErrors.instructions)}
            label="Instructions Editor"
          />
          <FieldError errors={touched.instructions ? [{ message: fieldErrors.instructions }] : []} />
        </Field>

        {/* Integration */}
        <Field>
          <div className="flex items-center justify-between mb-1">
            <FieldLabel>Integration</FieldLabel>
            <div className="flex items-center gap-2">
              {isInternal && onGenerateIntegration && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGenerateIntegration}
                  disabled={isGeneratingIntegration || !hasToolId}
                  title={!hasToolId ? "Set a Tool ID in Link Type first" : undefined}
                  className="flex items-center gap-1.5 border-brand/40 text-brand hover:bg-brand/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingIntegration ? (
                    <><Loader2 className="size-3.5 animate-spin" />Generating…</>
                  ) : (
                    <><Sparkles className="size-3.5" />Generate</>
                  )}
                </Button>
              )}
              {hasIntegration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                  <CheckCircle2 className="size-3" />
                  Filled
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <PromptEditor
              value={integration}
              onChange={(val) => onChange("integration", val)}
              placeholder="Write integration guide in Markdown…"
              disabled={isGeneratingIntegration}
              label="Integration Guide Editor"
            />
            {isGeneratingIntegration && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/70 backdrop-blur-[2px] z-10">
                <div className="flex items-center gap-2 rounded-full border border-brand/20 bg-white px-3 py-1.5 shadow-sm">
                  <Loader2 className="size-3.5 animate-spin text-brand" />
                  <span className="text-xs font-medium text-brand">Generating…</span>
                </div>
              </div>
            )}
          </div>
          {generateSuccess && !isGeneratingIntegration && (
            <div className="mt-1.5 flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5">
              <CheckCircle2 className="size-3.5 shrink-0 text-teal-600" />
              <span className="text-xs font-medium text-teal-700">Integration guide generated successfully.</span>
            </div>
          )}
          <FieldError errors={touched.integration ? [{ message: fieldErrors.integration }] : []} />
        </Field>

        {/* Tags */}
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
          <FieldError errors={touched.tags ? [{ message: fieldErrors.tags }] : []} />
        </Field>

      </CardContent>
    </Card>
  );
}
