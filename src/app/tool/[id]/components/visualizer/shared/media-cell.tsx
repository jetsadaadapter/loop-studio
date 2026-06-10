"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "./image-with-fallback";

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

  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
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

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 340; // popover max width
    const spaceOnRight = window.innerWidth - rect.right;

    let left = rect.right + 14;
    if (spaceOnRight < popoverWidth + 20) {
      // Position to the left of the trigger cell instead
      left = rect.left - popoverWidth - 14;
    }

    let top = rect.top - 12;
    const estimatedHeight = 420; // estimate popover max height
    const spaceOnBottom = window.innerHeight - rect.top;
    if (spaceOnBottom < estimatedHeight) {
      // Shift upwards so it stays in the viewport
      top = Math.max(10, window.innerHeight - estimatedHeight - 10);
    }

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (thumbErrored) return;
    cancelClose();
    updateCoords();
    setIsOpen(true);
  };

  const handleToggle = () => {
    if (thumbErrored) return;
    updateCoords();
    setIsOpen((prev) => !prev);
  };

  // Close immediately on scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      setIsOpen(false);
      setHoveredIndex(null);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Also handle scroll inside the nearest table container
    const tableContainer = triggerRef.current?.closest(".overflow-auto");
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (tableContainer) {
        tableContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen]);

  const mediaArr = Array.isArray(value) ? value : [];
  if (mediaArr.length === 0) return <span className="text-slate-400">-</span>;

  // Extract all valid image URLs
  const imageUrls = mediaArr.map(getImageUrl).filter(Boolean);
  if (imageUrls.length === 0) return <span className="text-slate-400">-</span>;

  const thumbUrl = imageUrls[0];

  return (
    <div
      ref={triggerRef}
      className="relative flex items-center gap-2 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleClose}
    >
      {/* Thumbnail Trigger */}
      <div
        onClick={handleToggle}
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
        onClick={handleToggle}
        className={cn("flex flex-col", thumbErrored ? "cursor-not-allowed" : "cursor-pointer group")}
      >
        <span className={cn("font-bold text-xs transition-colors", thumbErrored ? "text-slate-400" : "text-slate-800 group-hover:text-brand")}>
          {mediaArr.length} item{mediaArr.length > 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-slate-400">
          {thumbErrored ? "Image unavailable" : "Click/Hover to preview"}
        </span>
      </div>

      {/* Popover Preview Overlay rendered via React Portal */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          className="z-[9999] min-w-[280px] max-w-[340px] bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3.5 shadow-2xl duration-200 animate-in fade-in zoom-in-95"
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
        </div>,
        document.body
      )}
    </div>
  );
}
