"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { MediaCell } from "./media-cell";

interface OutputCellProps {
  value: unknown;
  columnKey: string;
  authorName?: string;
}

export function OutputCell({ value, columnKey, authorName }: OutputCellProps) {
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
      <div className="flex flex-col gap-1.5 max-w-70">
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

  if (
    columnKey === "url" ||
    columnKey === "facebookUrl" ||
    columnKey === "commentUrl" ||
    columnKey === "inputUrl" ||
    columnKey === "postUrl" ||
    columnKey === "permalink_url"
  ) {
    const urlStr = String(value);
    return (
      <a
        href={urlStr}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-650 hover:text-brand hover:underline inline-flex items-center gap-1 max-w-72 truncate font-semibold transition-colors"
      >
        <span className="truncate">{urlStr}</span>
        <ExternalLink className="size-3 shrink-0" />
      </a>
    );
  }

  if (columnKey === "media") {
    return <MediaCell value={value} />;
  }

  if (columnKey === "profilePicture" || columnKey === "profilepicture") {
    const imgUrl = String(value);
    return (
      <div className="size-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 select-none shadow-3xs">
        <ImageWithFallback
          src={imgUrl}
          alt="Profile Avatar"
          className="size-full object-cover"
        />
      </div>
    );
  }

  if (
    columnKey === "text" ||
    columnKey === "caption" ||
    columnKey === "message" ||
    columnKey === "summary" ||
    columnKey === "summary_of_intent" ||
    columnKey === "previewTitle" ||
    columnKey === "previewDescription" ||
    columnKey === "postTitle" ||
    columnKey === "posttitle"
  ) {
    const textStr = String(value);
    const limit = 90;
    const isLong = textStr.length > limit;

    return (
      <div className="flex flex-col gap-1.5 max-w-125 text-slate-750 leading-relaxed font-normal">
        {authorName && (
          <span className="text-[10px] font-extrabold text-indigo-750 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md self-start font-sans leading-none tracking-tight">
            {authorName}
          </span>
        )}
        <p
          className={cn(
            "text-xs whitespace-pre-wrap",
            !isExpanded && "line-clamp-2",
          )}
        >
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
      <span className="text-slate-500 font-sans text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
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
            : "bg-slate-100 text-slate-500 border-slate-200",
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
  if (normalized === "likes" || normalized === "likescount")
    return "Number of likes";
  if (normalized === "comments" || normalized === "commentscount")
    return "Number of comments";
  if (normalized === "shares") return "Number of shares";
  if (normalized === "viewscount") return "Number of views";
  if (normalized === "commenturl") return "Comment Link";
  if (normalized === "commentid") return "Comment ID";
  if (normalized === "profilepicture") return "Profile Picture";
  if (normalized === "profilename") return "Profile Name";
  if (normalized === "profileid") return "Profile ID";
  if (normalized === "profileurl") return "Profile Link";

  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

// MediaCell helpers and component have been refactored into modular media-cell.tsx
