"use client";

import { useEffect, useState } from "react";
import { BookOpen, Copy, Check, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InstructionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstructionPreviewDialog({
  open,
  onOpenChange,
}: InstructionPreviewDialogProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;

    async function fetchInstruction() {
      setLoading(true);
      try {
        console.log("[InstructionPreviewDialog] Fetching integration guide");
        const res = await fetch("/api/manage/keys/instruction");
        console.log("[InstructionPreviewDialog] Response status:", res.status, res.statusText);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("[InstructionPreviewDialog] Response not OK:", errorText);
          throw new Error(`Failed to load instructions: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("[InstructionPreviewDialog] Response data:", { success: data.success, contentLength: data.content?.length });

        if (data.success && data.content) {
          console.log("[InstructionPreviewDialog] Content loaded successfully");
          setContent(data.content);
        } else {
          throw new Error(data.error || "Failed to load instructions");
        }
      } catch (error) {
        console.error("[InstructionPreviewDialog] Error loading instruction:", error);
        toast.error(`Failed to load integration guide: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    }

    fetchInstruction();
  }, [open]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Guide copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy content");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden p-0 flex flex-col rounded-2xl border border-slate-200/60 shadow-lg font-sans">
        <div className="bg-linear-to-r from-slate-50 via-white to-indigo-50/30 px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2 font-sans">
              <BookOpen className="size-5 text-brand" />
              Integration Guide
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-sans">
              Learn how to authenticate and call APIs using your App ID and Secret Key
            </DialogDescription>
          </DialogHeader>

          {content && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 text-xs h-8 border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs rounded-lg font-sans shrink-0 cursor-pointer"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5 text-slate-500" />
              )}
              {copied ? "Copied Guide" : "Copy Guide"}
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 text-brand animate-spin" />
              <p className="text-xs text-slate-500 font-sans">Loading integration guide...</p>
            </div>
          ) : content ? (
            <article className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xs">
              <div className="prose prose-xs max-w-none font-sans text-xs leading-6 text-slate-700 [&>*+*]:mt-4 prose-headings:text-slate-900 prose-headings:font-semibold prose-strong:text-slate-900 prose-p:my-3 prose-p:text-slate-650 prose-li:my-2 prose-a:text-brand prose-a:underline hover:prose-a:text-brand/80">
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
                          className="rounded bg-slate-100/80 px-1.5 py-0.5 text-[0.85em] font-mono text-slate-800"
                          {...rest}
                        >
                          {children}
                        </code>
                      ) : (
                        <div className="relative group my-3">
                          <pre className="overflow-x-auto rounded-xl border border-slate-200/65 bg-slate-950 p-4 text-xs font-mono text-slate-100 shadow-sm leading-5">
                            <code {...rest}>{children}</code>
                          </pre>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-2 size-7 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                                toast.success("Code block copied!");
                              } catch {
                                toast.error("Failed to copy code");
                              }
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                    blockquote: (props) => (
                      <blockquote
                        className="border-l-4 border-amber-500/70 bg-amber-50/60 rounded-r-lg px-4 py-3 italic text-slate-700 my-4 font-sans"
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
                  {content}
                </Markdown>
              </div>
            </article>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-xs italic text-slate-450 font-sans">
              No instructions found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
