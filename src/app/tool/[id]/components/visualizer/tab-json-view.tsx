"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabJsonViewProps {
  items: unknown[];
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
      let cls = "text-[#b5cea8]"; // default: number (pale green)
      
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-[#9cdcfe] font-semibold"; // key (light blue)
        } else {
          cls = "text-[#ce9178]"; // string (terracotta)
        }
      } else if (/true|false/.test(match)) {
        cls = "text-[#569cd6] font-bold"; // boolean (blue)
      } else if (/null/.test(match)) {
        cls = "text-[#d16969] font-medium"; // null (rose-brown)
      }
      
      return `<span class="${cls}">${match}</span>`;
    });

    return colored;
  };

  return (
    <div className="relative flex-1 h-full min-h-0 bg-[#0f1013] p-4 flex flex-col overflow-hidden">
      {/* Copy Button Toolbar */}
      <div className="absolute top-6 right-8 z-10">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="h-8 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md text-xs font-semibold px-3 gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 text-zinc-400" />
              <span>Copy JSON</span>
            </>
          )}
        </Button>
      </div>

      {/* Pretty Code Container */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-850 bg-[#0b0c0e] p-5 shadow-inner">
        <pre className="font-mono text-xs leading-relaxed text-zinc-400">
          <code 
            dangerouslySetInnerHTML={{ __html: highlightJson(jsonStr) }} 
            className="block whitespace-pre"
          />
        </pre>
      </div>
    </div>
  );
}
