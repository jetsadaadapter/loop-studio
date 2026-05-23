"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";

interface OutputCellProps {
  value: unknown;
  columnKey: string;
}

export function OutputCell({ value, columnKey }: OutputCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedDrm, setCopiedDrm] = useState(false);

  if (value === null || value === undefined) {
    return <span className="text-slate-400">-</span>;
  }

  if (columnKey === "drm_info" || columnKey === "drmInfo") {
    const rawStr = String(value);
    return (
      <div className="flex items-center gap-2 select-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200/50 text-indigo-700 text-[10px] font-bold rounded-lg uppercase shadow-3xs">
          <span className="size-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span>DRM Secured</span>
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(rawStr);
            setCopiedDrm(true);
            setTimeout(() => setCopiedDrm(false), 2000);
          }}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-550 hover:text-slate-700 font-bold px-2 py-0.5 rounded-md shadow-3xs active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1"
        >
          {copiedDrm ? "Copied!" : "Copy JSON"}
        </button>
      </div>
    );
  }

  if (columnKey === "sentiment") {
    if (!value) {
      return <span className="text-slate-400">-</span>;
    }
    const sentiment = String(value).toLowerCase();
    if (sentiment === "positive") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500 border border-emerald-400 text-[9.5px] text-white font-extrabold rounded-full uppercase shadow-xs shadow-emerald-500/10">
          <span>Positive</span>
        </span>
      );
    }
    if (sentiment === "negative") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500 border border-rose-400/40 text-[9.5px] text-white font-extrabold rounded-full uppercase shadow-xs shadow-rose-500/10">
          <span>Negative</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-600 border border-slate-500 text-[9.5px] text-white font-extrabold rounded-full uppercase shadow-xs">
        <span>{String(value)}</span>
      </span>
    );
  }

  if (columnKey === "keywords") {
    const kwArr = Array.isArray(value) ? value : [];
    if (kwArr.length === 0) return <span className="text-slate-400">-</span>;

    const limit = 5;
    const isLong = kwArr.length > limit;
    const displayedKws = isExpanded ? kwArr : kwArr.slice(0, limit);

    return (
      <div className="flex flex-col gap-1.5 max-w-[280px]">
        <div className="flex flex-wrap gap-1">
          {displayedKws.map((kw: unknown, kIdx: number) => (
            <span
              key={kIdx}
              className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded text-[9px] font-semibold whitespace-nowrap"
            >
              #{String(kw)}
            </span>
          ))}
          {!isExpanded && isLong && (
            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200/60 rounded text-[9px] font-semibold whitespace-nowrap select-none">
              +{kwArr.length - limit} more
            </span>
          )}
        </div>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-brand hover:text-brand/80 font-bold self-start mt-0.5 flex items-center gap-0.5 cursor-pointer transition-colors"
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

  if (columnKey === "url" || columnKey === "facebookUrl") {
    const urlStr = String(value);
    return (
      <a
        href={urlStr}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-650 hover:text-brand hover:underline inline-flex items-center gap-1 max-w-[200px] truncate font-semibold transition-colors"
      >
        <span className="truncate">{urlStr}</span>
        <ExternalLink className="size-3 shrink-0" />
      </a>
    );
  }

  if (columnKey === "media") {
    return <MediaCell value={value} />;
  }

  if (
    columnKey === "text" ||
    columnKey === "caption" ||
    columnKey === "message" ||
    columnKey === "summary" ||
    columnKey === "previewTitle" ||
    columnKey === "previewDescription"
  ) {
    const textStr = String(value);
    const limit = 90;
    const isLong = textStr.length > limit;

    return (
      <div className="flex flex-col gap-1 max-w-[500px] text-slate-750 leading-relaxed font-normal">
        <p className={cn("text-xs whitespace-pre-wrap", !isExpanded && "line-clamp-2")}>
          {textStr}
        </p>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-brand hover:text-brand/80 font-bold self-start mt-0.5 flex items-center gap-0.5 cursor-pointer transition-colors"
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
      <span className="text-slate-500 font-mono text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
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
            ? "bg-emerald-50 text-emerald-700 border-emerald-250"
            : "bg-slate-100 text-slate-500 border-slate-200"
        )}
      >
        {String(value)}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

export function getHeaderLabel(key: string): string {
  const normalized = key.toLowerCase();
  if (normalized === "likes") return "Number of likes";
  if (normalized === "comments" || normalized === "commentscount") return "Number of comments";
  if (normalized === "shares") return "Number of shares";
  if (normalized === "viewscount") return "Number of views";

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
  const [thumbErrored, setThumbErrored] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredIndex(null);
    }, 350);
  };

  const mediaArr = Array.isArray(value) ? value : [];
  if (mediaArr.length === 0) return <span className="text-slate-400">-</span>;

  // Extract all valid image URLs
  const imageUrls = mediaArr.map(getImageUrl).filter(Boolean);
  if (imageUrls.length === 0) return <span className="text-slate-400">-</span>;

  const thumbUrl = imageUrls[0];

  return (
    <div
      className="relative flex items-center gap-2 select-none"
      onMouseEnter={() => { if (!thumbErrored) { cancelClose(); setIsOpen(true); } }}
      onMouseLeave={scheduleClose}
    >
      {/* Thumbnail Trigger */}
      <div
        onClick={() => { if (!thumbErrored) setIsOpen(!isOpen); }}
        className={cn(
          "size-9 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 transition-all shadow-sm group relative",
          thumbErrored ? "cursor-not-allowed" : "cursor-pointer hover:border-brand active:scale-95"
        )}
      >
        <ImageWithFallback
          src={thumbUrl}
          alt="Primary media cover"
          className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={() => setThumbErrored(true)}
        />
        {/* Subtle hover icon indicator */}
        {!thumbErrored && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-[10px] text-white font-bold">View</span>
          </div>
        )}
      </div>

      <div
        onClick={() => { if (!thumbErrored) setIsOpen(!isOpen); }}
        className={cn("flex flex-col", thumbErrored ? "cursor-not-allowed" : "cursor-pointer group")}
      >
        <span className={cn("font-bold text-xs transition-colors", thumbErrored ? "text-slate-400" : "text-slate-800 group-hover:text-brand")}>
          {mediaArr.length} item{mediaArr.length > 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-slate-400">
          {thumbErrored ? "Image unavailable" : "Click/Hover to preview"}
        </span>
      </div>

      {/* Popover Preview Overlay */}
      {isOpen && (
        <div 
          className="absolute left-0 top-11 z-50 min-w-[280px] max-w-[340px] bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Media Album ({imageUrls.length} image{imageUrls.length > 1 ? "s" : ""})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Hover to view large</span>
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
                  "aspect-square rounded overflow-hidden border bg-slate-50 hover:border-brand active:scale-95 transition-all shadow-sm relative group",
                  idx === 0 ? "border-slate-350" : "border-slate-200"
                )}
                onMouseEnter={() => setHoveredIndex(idx)}
              >
                <ImageWithFallback
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
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 animate-in fade-in duration-150">
              <span className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">
                Photo {hoveredIndex + 1} Preview:
              </span>
              <div className="w-full aspect-[4/3] rounded bg-slate-50 border border-slate-200 overflow-hidden relative">
                <ImageWithFallback
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
