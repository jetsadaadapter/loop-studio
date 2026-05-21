"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface OutputCellProps {
  value: unknown;
  columnKey: string;
}

export function OutputCell({ value, columnKey }: OutputCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (value === null || value === undefined) {
    return <span className="text-zinc-700">-</span>;
  }

  if (columnKey === "url" || columnKey === "facebookUrl") {
    const urlStr = String(value);
    return (
      <a
        href={urlStr}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 max-w-[200px] truncate"
      >
        <span className="truncate">{urlStr}</span>
        <ExternalLink className="size-3 shrink-0" />
      </a>
    );
  }

  if (columnKey === "media") {
    return <MediaCell value={value} />;
  }

  if (columnKey === "text" || columnKey === "caption" || columnKey === "message") {
    const textStr = String(value);
    const limit = 90;
    const isLong = textStr.length > limit;

    return (
      <div className="flex flex-col gap-1 max-w-[380px] text-zinc-300 leading-normal">
        <p className={cn("text-xs font-normal whitespace-pre-wrap", !isExpanded && "line-clamp-2")}>
          {textStr}
        </p>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold self-start mt-0.5 flex items-center gap-0.5 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="size-3" />
              </>
            ) : (
              <>
                <span>Show more</span>
                <ChevronDown className="size-3" />
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <span className="text-zinc-500 font-mono text-[10px] bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">
        {Array.isArray(value) ? `[Array: ${value.length}]` : "[Object]"}
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
          value
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-zinc-800 text-zinc-500 border-zinc-700"
        )}
      >
        {String(value)}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

export function getHeaderLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  // Exclude webpage URLs (Facebook posts, videos, permalinks, groups, etc.)
  if (
    url.includes("facebook.com") && 
    (url.includes("/posts/") || 
     url.includes("/permalink/") || 
     url.includes("/videos/") || 
     url.includes("/groups/") ||
     url.includes("/photo"))
  ) {
    return false;
  }
  return true;
}

function getImageUrl(item: unknown): string {
  if (!item) return "";
  if (typeof item === "string") {
    return isValidImageUrl(item) ? item : "";
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    
    // Always prefer thumbnail if available and valid
    if (typeof obj.thumbnail === "string" && obj.thumbnail && isValidImageUrl(obj.thumbnail)) {
      return obj.thumbnail;
    }
    if (typeof obj.image === "string" && obj.image && isValidImageUrl(obj.image)) {
      return obj.image;
    }
    if (typeof obj.url === "string" && obj.url && isValidImageUrl(obj.url)) {
      return obj.url;
    }
  }
  return "";
}

interface MediaCellProps {
  value: unknown;
}

export function MediaCell({ value }: MediaCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const mediaArr = Array.isArray(value) ? value : [];
  if (mediaArr.length === 0) return <span className="text-zinc-700">-</span>;

  // Extract all valid image URLs
  const imageUrls = mediaArr.map(getImageUrl).filter(Boolean);
  if (imageUrls.length === 0) return <span className="text-zinc-700">-</span>;

  const thumbUrl = imageUrls[0];

  return (
    <div 
      className="relative flex items-center gap-2 select-none"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        setIsOpen(false);
        setHoveredIndex(null);
      }}
    >
      {/* Thumbnail Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="size-9 rounded-lg overflow-hidden border border-zinc-800 shrink-0 bg-zinc-950 cursor-pointer hover:border-blue-500/80 active:scale-95 transition-all shadow-md group relative"
      >
        <img 
          src={thumbUrl} 
          alt="Primary media cover" 
          className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {/* Subtle hover icon indicator */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <span className="text-[10px] text-white font-bold">View</span>
        </div>
      </div>

      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col cursor-pointer group"
      >
        <span className="text-zinc-300 font-bold text-xs group-hover:text-blue-400 transition-colors">
          {mediaArr.length} item{mediaArr.length > 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
          Click/Hover to preview
        </span>
      </div>

      {/* Popover Preview Overlay */}
      {isOpen && (
        <div className="absolute left-0 top-11 z-50 min-w-[280px] max-w-[340px] bg-[#121316]/95 backdrop-blur-md border border-zinc-800/95 rounded-xl p-3.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-2.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Media Album ({imageUrls.length} image{imageUrls.length > 1 ? "s" : ""})
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Hover to view large</span>
          </div>

          {/* Grid of Images */}
          <div className="grid grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {imageUrls.map((url, idx) => (
              <a
                key={`media-popover-${idx}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "aspect-square rounded overflow-hidden border bg-zinc-950 hover:border-blue-400/80 active:scale-95 transition-all shadow-sm relative group",
                  idx === 0 ? "border-zinc-700/90" : "border-zinc-850"
                )}
                onMouseEnter={() => setHoveredIndex(idx)}
              >
                <img 
                  src={url} 
                  alt={`Album photo ${idx + 1}`} 
                  className="size-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[8px] text-white font-bold">Open</span>
                </div>
              </a>
            ))}
          </div>

          {/* Expanded Preview on Hover */}
          {hoveredIndex !== null && imageUrls[hoveredIndex] && (
            <div className="mt-3 pt-2.5 border-t border-zinc-850 flex flex-col gap-1.5 animate-in fade-in duration-150">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Photo {hoveredIndex + 1} Preview:
              </span>
              <div className="w-full aspect-[4/3] rounded bg-zinc-950 border border-zinc-800 overflow-hidden relative">
                <img 
                  src={imageUrls[hoveredIndex]} 
                  alt="Expanded preview" 
                  className="size-full object-contain animate-in zoom-in-95 duration-150"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
