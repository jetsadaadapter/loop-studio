"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabJsonViewProps {
  items: unknown;
}

export function TabJsonView({ items }: TabJsonViewProps) {
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(items, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe and super clean HTML syntax highlighter for JSON
  const highlightJson = (json: string) => {
    if (!json) return "";
    
    // Escape standard HTML tags
    const escaped = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Regular expression to match keys, strings, numbers, booleans, and nulls
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

    const colored = escaped.replace(regex, (match) => {
      let cls = "text-amber-700"; // default: number
      
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-indigo-650 font-semibold"; // key
        } else {
          cls = "text-emerald-700"; // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-rose-600 font-bold"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-slate-400 font-medium"; // null
      }
      
      return `<span class="${cls}">${match}</span>`;
    });

    return colored;
  };

  return (
    <div className="relative flex-1 h-full min-h-0 bg-slate-50 p-4 flex flex-col overflow-hidden">
      {/* Copy Button Toolbar */}
      <div className="absolute top-7 right-7 z-10">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="h-7 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md text-[11px] font-semibold px-2.5 gap-1 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3 text-slate-400" />
              <span>Copy JSON</span>
            </>
          )}
        </Button>
      </div>

      {/* Pretty Code Container */}
      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <pre className="font-sans text-[11px] leading-relaxed text-slate-650">
          <code
            dangerouslySetInnerHTML={{ __html: highlightJson(jsonStr) }}
            className="block whitespace-pre"
          />
        </pre>
      </div>
    </div>
  );
}
