"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import Markdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type InstructionsPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructions: string;
  onCopy: () => Promise<void>;
  onDownload: () => void;
  didCopy: boolean;
};

export function InstructionsPreviewDialog({
  open,
  onOpenChange,
  instructions,
  onCopy,
  onDownload,
  didCopy,
}: InstructionsPreviewDialogProps) {
  const [previewMode, setPreviewMode] = useState<"markdown" | "text">(
    "markdown",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden p-0">
        <div className="bg-linear-to-r from-slate-50 via-white to-emerald-50/50 px-5 py-4 border-b border-slate-200">
          <DialogHeader className="mb-0 space-y-3">
            <DialogTitle>Instructions Preview</DialogTitle>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1 shadow-xs">
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === "markdown" ? "secondary" : "ghost"}
                  onClick={() => setPreviewMode("markdown")}
                >
                  Markdown
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === "text" ? "secondary" : "ghost"}
                  onClick={() => setPreviewMode("text")}
                >
                  Text
                </Button>
              </div>

              <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-xs">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onCopy}
                  disabled={!instructions.trim()}
                  className="flex items-center gap-1.5"
                >
                  {didCopy ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {didCopy ? "Copied" : "Copy"}
                </Button>

                <div className="h-5 w-px bg-slate-200" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onDownload}
                  disabled={!instructions.trim()}
                  className="flex items-center gap-1.5"
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[62vh] overflow-y-auto bg-white p-5">
          {!instructions.trim() ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs italic text-slate-500">
              No instructions provided yet.
            </div>
          ) : previewMode === "markdown" ? (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="prose prose-xs max-w-none font-(family-name:--font-inter) text-xs leading-6 text-slate-900 [&>*+*]:mt-3 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-p:my-3 prose-p:text-xs prose-li:my-2 prose-li:text-xs prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700 prose-code:text-xs">
                <Markdown
                  components={{
                    code: ({
                      inline,
                      ...rest
                    }: React.HTMLAttributes<HTMLElement> & {
                      inline?: boolean;
                    }) => {
                      return inline ? (
                        <code
                          className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[0.8em] text-slate-900"
                          {...rest}
                        />
                      ) : (
                        <code
                          className="block overflow-x-auto rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-900"
                          {...rest}
                        />
                      );
                    },
                    pre: (props) => (
                      <pre
                        className="my-4 overflow-x-auto rounded-md bg-transparent p-0"
                        {...props}
                      />
                    ),
                    blockquote: (props) => (
                      <blockquote
                        className="border-l-4 border-emerald-500/70 bg-emerald-50 px-3 py-2 italic text-slate-700"
                        {...props}
                      />
                    ),
                  }}
                >
                  {instructions}
                </Markdown>
              </div>
            </article>
          ) : (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <pre className="whitespace-pre-wrap wrap-break-word text-xs leading-6 text-slate-800 font-(family-name:--font-inter)">
                {instructions}
              </pre>
            </article>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
