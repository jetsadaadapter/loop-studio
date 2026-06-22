"use client";

import { useState } from "react";
import { Check, Copy, Download, BookOpen, Box, X } from "lucide-react";
import { downloadPostmanCollection } from "./postman-generator";
import { getManageTool } from "@/core/services/manage-tools.service";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type IntegrationPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: string;
  onCopy: () => Promise<void>;
  onDownload: () => void;
  didCopy: boolean;
  toolId?: string;
  appName?: string;
};

function CodeBlock({ children, className, ...rest }: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="relative group my-3">
      <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs font-mono text-slate-100 shadow-sm leading-5">
        <code className={className} {...rest}>{children}</code>
      </pre>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2 size-7 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center rounded-md"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500 animate-in fade-in zoom-in-50 duration-200" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  );
}

export function IntegrationPreviewDialog({
  open,
  onOpenChange,
  integration,
  onCopy,
  onDownload,
  didCopy,
  toolId,
  appName = "tool",
}: IntegrationPreviewDialogProps) {
  const [previewMode, setPreviewMode] = useState<"markdown" | "text">("markdown");
  const [isDownloadingPostman, setIsDownloadingPostman] = useState(false);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [postmanAppId, setPostmanAppId] = useState("");
  const [postmanAppSecret, setPostmanAppSecret] = useState("");

  async function handlePostmanDownload() {
    if (!toolId) return;
    setIsDownloadingPostman(true);
    try {
      const tool = await getManageTool(toolId);
      downloadPostmanCollection(toolId, appName, tool.params ?? [], tool.scripts ?? [], {
        appId: postmanAppId.trim(),
        appSecret: postmanAppSecret.trim(),
      });
      setShowApiKeyForm(false);
    } catch {
      toast.error("Failed to fetch tool data for Postman collection.");
    } finally {
      setIsDownloadingPostman(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden p-0 rounded-2xl border border-slate-200/60 shadow-lg font-sans">
        <div className="bg-linear-to-r from-slate-50 via-white to-emerald-50/50 px-5 py-4 border-b border-slate-200">
          <DialogHeader className="mb-0 space-y-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2 font-sans">
                <BookOpen className="size-5 text-brand" />
                Integration Preview
              </DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
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
                  disabled={!integration.trim()}
                  className="flex items-center gap-1.5 font-sans"
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
                  disabled={!integration.trim()}
                  className="flex items-center gap-1.5 font-sans"
                >
                  <Download className="size-4" />
                  Download
                </Button>

                {toolId && (
                  <>
                    <div className="h-5 w-px bg-slate-200" />
                    <Button
                      type="button"
                      size="sm"
                      variant={showApiKeyForm ? "secondary" : "ghost"}
                      onClick={() => setShowApiKeyForm((v) => !v)}
                      className="flex items-center gap-1.5 font-sans text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Box className="size-4" />
                      Postman
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* API Key form — shown when Postman is toggled */}
        {showApiKeyForm && (
          <div className="border-b border-slate-200 bg-amber-50/50 px-5 py-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">
              Enter your API credentials to embed them in the Postman collection variables.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-40">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">App ID <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={postmanAppId}
                  onChange={(e) => setPostmanAppId(e.target.value)}
                  placeholder="your-app-id"
                  className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-mono outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-40">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">App Secret <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  value={postmanAppSecret}
                  onChange={(e) => setPostmanAppSecret(e.target.value)}
                  placeholder="your-app-secret"
                  className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-mono outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand/50 transition-colors"
                />
              </div>
              <Button
                type="button"
                size="sm"
                disabled={isDownloadingPostman || !postmanAppId.trim() || !postmanAppSecret.trim()}
                onClick={() => void handlePostmanDownload()}
                className="h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 rounded-md flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Download className="size-3.5" />
                {isDownloadingPostman ? "Exporting…" : "Download Collection"}
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Credentials are only used locally to populate the collection — they are never sent to any server.</p>
          </div>
        )}

        <div className="max-h-[62vh] overflow-y-auto bg-slate-50/30 p-5">
          {!integration.trim() ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs italic text-slate-500 font-sans">
              No integration guide provided yet.
            </div>
          ) : previewMode === "markdown" ? (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="prose prose-xs max-w-none font-sans text-xs leading-6 text-slate-700 [&>*+*]:mt-3 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-p:my-3 prose-p:text-xs prose-li:my-2 prose-li:text-xs prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({
                      className,
                      children,
                      ...rest
                    }: React.HTMLAttributes<HTMLElement>) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !String(children).includes("\n");
                      return isInline ? (
                        <code
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] font-mono text-slate-800"
                          {...rest}
                        >
                          {children}
                        </code>
                      ) : (
                        <CodeBlock className={className} {...rest}>
                          {children}
                        </CodeBlock>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                    blockquote: (props) => (
                      <blockquote
                        className="border-l-4 border-emerald-500/70 bg-emerald-50/60 rounded-r-lg px-4 py-3 italic text-slate-700 my-4 font-sans"
                        {...props}
                      />
                    ),
                    table: (props) => (
                      <div className="my-4 overflow-x-auto rounded-xl border border-slate-200/60 shadow-xs">
                        <table className="w-full text-left border-collapse text-xs font-sans" {...props} />
                      </div>
                    ),
                    thead: (props) => (
                      <thead className="bg-slate-50 border-b border-slate-200/60 font-semibold font-sans" {...props} />
                    ),
                    th: (props) => (
                      <th className="p-3 font-semibold text-slate-800 font-sans" {...props} />
                    ),
                    td: (props) => (
                      <td className="p-3 border-t border-slate-100 text-slate-650 font-sans" {...props} />
                    ),
                  }}
                >
                  {integration}
                </Markdown>
              </div>
            </article>
          ) : (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <pre className="whitespace-pre-wrap wrap-break-word text-xs leading-6 text-slate-800 font-sans">
                {integration}
              </pre>
            </article>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
