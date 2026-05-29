"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Maximize2,
  Minimize2,
  FileUp,
  AlertTriangle,
  CheckCircle2,
  Bold,
  Italic,
  Code,
  Braces,
  Sparkles,
  AlignLeft,
  Undo2,
  Redo2,
  PenLine,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PromptEditorProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
}

export function PromptEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter system prompt instructions…",
  hasError = false,
}: PromptEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  // Undo / Redo History stack
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isHistoryActionRef = useRef(false);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync history during render when props change externally without keyboard inputs (e.g. initial render)
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    if (history.length === 1 && history[0] === "") {
      setHistory([value]);
      setHistoryIndex(0);
    }
  }

  // Typing debounced history stack push
  useEffect(() => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }

    if (value === history[historyIndex]) return;

    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      setHistory((prev) => {
        const nextHistory = prev.slice(0, historyIndex + 1);
        return [...nextHistory, value];
      });
      setHistoryIndex((prevIdx) => prevIdx + 1);
    }, 400);

    return () => {
      if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    };
  }, [value, historyIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const prevVal = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onChange(prevVal);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryActionRef.current = true;
      const nextVal = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onChange(nextVal);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fullscreenTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert formatting at selection
  const insertText = (before: string, after: string = "") => {
    const activeTextarea = isFullscreen ? fullscreenTextareaRef.current : textareaRef.current;
    if (!activeTextarea) return;

    const start = activeTextarea.selectionStart;
    const end = activeTextarea.selectionEnd;
    const text = activeTextarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;

    onChange(text.substring(0, start) + replacement + text.substring(end));

    // Refocus and select
    setTimeout(() => {
      activeTextarea.focus();
      activeTextarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 50);
  };

  // Import file helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        onChange(text);
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be selected again
    e.target.value = "";
  };

  // Real-time JSON validation & block extraction computed on the fly during render
  const jsonStatus = (() => {
    if (!value.trim()) {
      return { isValid: true, message: "Prompt is empty.", blocksCount: 0 };
    }

    // Find JSON blocks matching code-blocks or raw bracket scopes
    const jsonBlocks: string[] = [];

    // 1. Try extracting fenced ```json ... ``` blocks
    const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;
    while ((match = codeBlockRegex.exec(value)) !== null) {
      if (match[1]?.trim()) {
        jsonBlocks.push(match[1].trim());
      }
    }

    // 2. If no fenced blocks, try finding raw curly braces { ... }
    if (jsonBlocks.length === 0) {
      let openBraces = 0;
      let startIndex = -1;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === "{") {
          if (openBraces === 0) {
            startIndex = i;
          }
          openBraces++;
        } else if (value[i] === "}") {
          if (openBraces > 0) {
            openBraces--;
            if (openBraces === 0 && startIndex !== -1) {
              const possibleJson = value.substring(startIndex, i + 1);
              // Avoid matching trivial single characters or non-JSON fragments
              if (possibleJson.length > 5 && possibleJson.includes(":")) {
                jsonBlocks.push(possibleJson.trim());
              }
            }
          }
        }
      }
    }

    if (jsonBlocks.length === 0) {
      return {
        isValid: true,
        message: "No specific JSON schema blocks detected. Standard text flow is active.",
        blocksCount: 0,
      };
    }

    // Validate each detected block
    for (let idx = 0; idx < jsonBlocks.length; idx++) {
      try {
        JSON.parse(jsonBlocks[idx]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid JSON";
        return {
          isValid: false,
          message: `JSON Block #${idx + 1} has syntax error: ${msg}`,
          blocksCount: jsonBlocks.length,
        };
      }
    }

    return {
      isValid: true,
      message: `Verified: All ${jsonBlocks.length} JSON configuration blocks are syntactically valid!`,
      blocksCount: jsonBlocks.length,
    };
  })();

  // Pretty-print any JSON block inside the editor using a smart brace-balancing parser
  const formatJSON = () => {
    // If the entire text is a JSON object, format it directly
    try {
      const parsed = JSON.parse(value.trim());
      onChange(JSON.stringify(parsed, null, 2));
      return;
    } catch { }

    // Smart nested brace-balancing search
    let found = false;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "{") {
        let bracesCount = 1;
        for (let j = i + 1; j < value.length; j++) {
          if (value[j] === "{") bracesCount++;
          if (value[j] === "}") {
            bracesCount--;
            if (bracesCount === 0) {
              const candidate = value.substring(i, j + 1);
              // Avoid auto-formatting trivial text or template tags e.g. {currentItem}
              if (candidate.length > 5 && candidate.includes(":")) {
                try {
                  const parsed = JSON.parse(candidate);
                  const formatted = JSON.stringify(parsed, null, 2);
                  onChange(value.substring(0, i) + formatted + value.substring(j + 1));
                  found = true;
                  break;
                } catch {
                  // Not valid JSON, keep searching
                }
              }
            }
          }
        }
      }
      if (found) break;
    }

    if (!found) {
      alert("Cannot auto-format. Please ensure the target JSON block has no syntax errors first (note: double-brace placeholders like {{currentItem}} are safely ignored and must be outside the main JSON block).");
    }
  };

  const toolbar = (
    <div className="flex flex-col border-b border-slate-100 bg-slate-50/70 p-2 rounded-t-xl gap-2 select-none">
      {/* Row 1: Mode Switcher and Actions */}
      <div className="flex items-center justify-between w-full gap-2">
        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center bg-slate-200/50 rounded-lg p-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-6.5 px-2.5 rounded-md text-[10px] font-bold transition-all border-none shadow-none cursor-pointer ${editorMode === "write"
              ? "bg-white text-slate-800 shadow-2xs"
              : "text-slate-500 hover:text-slate-800"
              }`}
            onClick={() => setEditorMode("write")}
          >
            <PenLine className="size-3 mr-1" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-6.5 px-2.5 rounded-md text-[10px] font-bold transition-all border-none shadow-none cursor-pointer ${editorMode === "preview"
              ? "bg-white text-slate-800 shadow-2xs"
              : "text-slate-500 hover:text-slate-800"
              }`}
            onClick={() => setEditorMode("preview")}
          >
            <Eye className="size-3 mr-1" />
            Preview
          </Button>
        </div>

        {/* File & Window Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {editorMode === "write" && (
            <>
              <input
                type="file"
                accept=".md,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id={`prompt-file-import-${isFullscreen ? "fs" : "normal"}`}
              />
              <Button
                type="button"
                variant="ghost"
                className="h-6.5 px-2.5 text-[10px] font-bold text-brand bg-brand/5 hover:bg-brand/10 hover:text-brand-strong border-0 rounded-md gap-1 cursor-pointer transition-colors"
                title="Import Markdown/Text file (.md, .txt)"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <FileUp className="size-3" />
                Import .md / .txt
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6.5 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md cursor-pointer transition-colors"
            title={isFullscreen ? "Collapse Editor" : "Fullscreen Editor"}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Row 2: Formatting ribbon (Only visible in edit mode) */}
      {editorMode === "write" && (
        <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-200/40 w-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6.5 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md disabled:opacity-30 cursor-pointer transition-colors"
            title="Undo"
            onClick={handleUndo}
            disabled={disabled || historyIndex <= 0}
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6.5 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md disabled:opacity-30 cursor-pointer transition-colors"
            title="Redo"
            onClick={handleRedo}
            disabled={disabled || historyIndex >= history.length - 1}
          >
            <Redo2 className="size-3.5" />
          </Button>
          <span className="h-3.5 w-px bg-slate-200 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6.5 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md cursor-pointer transition-colors"
            title="Bold"
            onClick={() => insertText("**", "**")}
            disabled={disabled}
          >
            <Bold className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6.5 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md cursor-pointer transition-colors"
            title="Italic"
            onClick={() => insertText("*", "*")}
            disabled={disabled}
          >
            <Italic className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6.5 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md cursor-pointer transition-colors"
            title="Code Block"
            onClick={() => insertText("```\n", "\n```")}
            disabled={disabled}
          >
            <Code className="size-3.5" />
          </Button>
          <span className="h-3.5 w-px bg-slate-200 mx-1" />
          <Button
            type="button"
            variant="ghost"
            className="h-6.5 px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md gap-1 cursor-pointer transition-colors"
            title="Insert JSON configuration structure"
            onClick={() =>
              insertText(
                '{\n  "startUrls": [\n    ""\n  ],\n  "goal": "",\n  "generatedSystemPrompt": ""\n}'
              )
            }
            disabled={disabled}
          >
            <Braces className="size-3" />
            JSON Template
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-6.5 px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-md gap-1 cursor-pointer transition-colors"
            title="Format JSON structures in prompt"
            onClick={formatJSON}
            disabled={disabled}
          >
            <AlignLeft className="size-3" />
            Format JSON
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-1.5 w-full">
      {/* Editor Container */}
      <div className={`rounded-xl border bg-white shadow-2xs overflow-hidden flex flex-col transition-all duration-300 ${hasError
        ? "border-brand focus-within:border-brand-strong focus-within:ring-1 focus-within:ring-brand-strong/20 shadow-sm shadow-brand/10"
        : "border-slate-200 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand-strong/20"
        }`}>
        {toolbar}
        {editorMode === "preview" ? (
          <div className="p-3.5 bg-slate-50 text-xs min-h-[140px] max-h-[350px] overflow-y-auto rounded-b-xl border-t border-slate-100/60 select-text">
            <PromptPreview text={value} />
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={5}
            disabled={disabled}
            className="border-0 focus-visible:ring-0 rounded-none resize-y bg-white text-xs leading-relaxed min-h-[140px] focus:outline-none p-3.5"
          />
        )}
      </div>

      {/* Validation status bar */}
      <div
        className={`flex items-start gap-1.5 p-2 rounded-lg text-[10px] leading-tight font-medium ${jsonStatus.isValid
          ? jsonStatus.blocksCount > 0
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-slate-50 text-slate-500 border border-slate-100/80"
          : "bg-brand/5 text-brand border border-brand/10"
          }`}
      >
        {jsonStatus.isValid ? (
          jsonStatus.blocksCount > 0 ? (
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
          )
        ) : (
          <AlertTriangle className="size-3.5 text-brand shrink-0 mt-0.5" />
        )}
        <p className="flex-1">{jsonStatus.message}</p>
      </div>

      {/* Reusable Fullscreen Editor Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-6 rounded-2xl gap-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Sparkles className="size-4 text-brand animate-pulse-slow" />
              Advanced Prompt Editor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Write, formatting prompt with markdown, and instantly verify JSON schemes with split-second feedback.
            </DialogDescription>
          </DialogHeader>

          {/* Fullscreen Editor Area */}
          <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
            {toolbar}
            {editorMode === "preview" ? (
              <div className="p-5 bg-slate-50 text-xs flex-1 overflow-y-auto rounded-b-xl border-t border-slate-100/60 select-text">
                <PromptPreview text={value} />
              </div>
            ) : (
              <Textarea
                ref={fullscreenTextareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="border-0 focus-visible:ring-0 rounded-none resize-none bg-white text-xs leading-relaxed flex-1 focus:outline-none p-4"
              />
            )}
          </div>

          {/* Expanded Status Bar */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-tight shadow-3xs ${jsonStatus.isValid
                ? jsonStatus.blocksCount > 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
                : "bg-brand/5 text-brand border border-brand/10"
                }`}
            >
              {jsonStatus.isValid ? (
                jsonStatus.blocksCount > 0 ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : (
                  <Sparkles className="size-3.5 text-slate-400" />
                )
              ) : (
                <AlertTriangle className="size-3.5 text-brand" />
              )}
              {jsonStatus.message}
            </div>

            <Button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="h-8.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromptPreview({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-1.5 italic">
        <Sparkles className="size-4 text-slate-300" />
        <span className="text-[10px]">Nothing to preview yet...</span>
      </div>
    );
  }

  // Mathematically clean, recursive balanced JSON brace extractor
  const getSegments = (input: string): { type: "text" | "json"; content: string }[] => {
    if (!input) return [];

    for (let i = 0; i < input.length; i++) {
      if (input[i] === "{") {
        let bracesCount = 1;
        for (let j = i + 1; j < input.length; j++) {
          if (input[j] === "{") bracesCount++;
          if (input[j] === "}") {
            bracesCount--;
            if (bracesCount === 0) {
              const candidate = input.substring(i, j + 1);
              if (candidate.length > 5 && candidate.includes(":")) {
                try {
                  JSON.parse(candidate);
                  const prevText = input.substring(0, i);
                  const nextText = input.substring(j + 1);

                  const results: { type: "text" | "json"; content: string }[] = [];
                  if (prevText) {
                    results.push({ type: "text", content: prevText });
                  }
                  results.push({ type: "json", content: candidate });
                  return [...results, ...getSegments(nextText)];
                } catch {
                  // Ignore parse error and keep walking the brackets search
                }
              }
            }
          }
        }
      }
    }

    return [{ type: "text", content: input }];
  };

  const segments = getSegments(text);

  const renderHighlightedJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const formatted = JSON.stringify(parsed, null, 2);

      return (
        <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[11px] leading-relaxed shadow-inner">
          <code className="block select-all whitespace-pre">
            {formatted.split("\n").map((line, lIdx) => {
              const highlightedLine = line.replace(
                /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g,
                (match) => {
                  let cls = "text-amber-300";
                  if (/:$/.test(match)) {
                    cls = "text-sky-300 font-bold";
                  } else if (/true|false/.test(match)) {
                    cls = "text-emerald-400";
                  } else if (/null/.test(match)) {
                    cls = "text-slate-400";
                  } else if (/^-?\d/.test(match)) {
                    cls = "text-violet-400";
                  }
                  return `<span class="${cls}">${match}</span>`;
                }
              );
              return (
                <div key={lIdx} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
              );
            })}
          </code>
        </pre>
      );
    } catch {
      return (
        <pre className="p-3 bg-slate-900 text-rose-300 rounded-lg overflow-x-auto font-sans text-[11px] leading-relaxed">
          <code>{jsonStr}</code>
        </pre>
      );
    }
  };

  const renderTextSegment = (txt: string) => {
    return txt.split("\n").map((line, idx) => {
      let content = line;
      let isHeader = false;
      let headerLevel = 0;

      const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        isHeader = true;
        headerLevel = headerMatch[1].length;
        content = headerMatch[2];
      }

      content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");
      content = content.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-sans text-slate-800 border border-slate-200/50">$1</code>');

      const innerHtml = { __html: content };

      if (isHeader) {
        if (headerLevel === 1) return <h1 key={idx} className="text-base font-bold text-slate-800 mt-3 mb-1" dangerouslySetInnerHTML={innerHtml} />;
        if (headerLevel === 2) return <h2 key={idx} className="text-sm font-bold text-slate-800 mt-2.5 mb-1" dangerouslySetInnerHTML={innerHtml} />;
        return <h3 key={idx} className="text-xs font-bold text-slate-800 mt-2 mb-1" dangerouslySetInnerHTML={innerHtml} />;
      }

      if (!line.trim()) return <div key={idx} className="h-2" />;

      if (/^\d+\.\s+/.test(line)) {
        return <p key={idx} className="pl-4 -indent-4 text-slate-600 text-xs my-0.5" dangerouslySetInnerHTML={innerHtml} />;
      }
      if (/^[-*+]\s+/.test(line)) {
        return <p key={idx} className="pl-4 -indent-4 text-slate-600 text-xs my-0.5" dangerouslySetInnerHTML={innerHtml} />;
      }

      return (
        <p key={idx} className="text-slate-600 text-xs my-1 leading-relaxed" dangerouslySetInnerHTML={innerHtml} />
      );
    });
  };

  return (
    <div className="space-y-3">
      {segments.map((seg, idx) => (
        <div key={idx} className="select-text">
          {seg.type === "json" ? (
            <div className="my-2 space-y-1">
              <span className="block text-[9px] font-bold text-brand uppercase tracking-wider">
                Parsed JSON Config Structure
              </span>
              {renderHighlightedJson(seg.content)}
            </div>
          ) : (
            renderTextSegment(seg.content)
          )}
        </div>
      ))}
    </div>
  );
}
