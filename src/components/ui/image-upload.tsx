"use client";

import * as React from "react";
import Image from "next/image";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  onError?: (message: string) => void;
  placeholder?: string;
  description?: string;
  className?: string;
  label?: string;
  previewSrc?: string;
  previewFit?: "cover" | "contain";
  maxFileSizeMb?: number;
  acceptedMimeTypes?: string[];
}

export function ImageUpload({
  value,
  onChange,
  onError,
  placeholder = "Upload file",
  description = "Drag or drop your files here or click to upload",
  className,
  label,
  previewSrc,
  previewFit = "cover",
  maxFileSizeMb = 5,
  acceptedMimeTypes = ["image/png", "image/jpeg", "image/webp"],
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");

  const resolvedPreviewSrc = React.useMemo(() => {
    if (previewSrc) return previewSrc;
    if (!value?.trim()) return "";
    return `/images/${encodeURIComponent(value.trim())}`;
  }, [previewSrc, value]);

  const handleClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const clearSelection = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isUploading) return;
    setUploadError("");
    onChange?.("");
  };

  const readUploadedImageId = (payload: unknown): string => {
    if (!payload || typeof payload !== "object") return "";

    const root = payload as Record<string, unknown>;
    const data =
      root.data && typeof root.data === "object"
        ? (root.data as Record<string, unknown>)
        : null;

    const candidates = [
      root.mediaId,
      root.imageId,
      root.id,
      root.fileId,
      data?.mediaId,
      data?.imageId,
      data?.id,
      data?.fileId,
    ];

    for (const value of candidates) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (!acceptedMimeTypes.includes(file.type)) {
      const message = `Invalid file type. Allowed: ${acceptedMimeTypes.join(", ")}`;
      setUploadError(message);
      onError?.(message);
      e.target.value = "";
      return;
    }

    const maxBytes = maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      const message = `File size must be ${maxFileSizeMb}MB or less.`;
      setUploadError(message);
      onError?.(message);
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/library/images/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const payload = (await response.json()) as unknown;
      const imageId = readUploadedImageId(payload);

      if (!imageId) {
        throw new Error("Upload completed but image id was not returned.");
      }

      onChange?.(imageId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to upload image.";
      setUploadError(message);
      onError?.(message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white p-6 transition-colors hover:bg-slate-50 cursor-pointer",
          value && "border-emerald-500 bg-emerald-50",
          isUploading && "cursor-not-allowed opacity-70",
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
          disabled={isUploading}
          aria-label={label || "Upload image"}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {resolvedPreviewSrc ? (
            previewFit === "contain" ? (
              <div className="mb-2 flex min-h-40 w-full max-w-xs items-center justify-center overflow-hidden rounded-md bg-slate-50 p-2">
                <Image
                  src={resolvedPreviewSrc}
                  alt="Uploaded preview"
                  width={320}
                  height={320}
                  className="block h-auto w-auto max-h-40 max-w-full object-contain object-center"
                  unoptimized
                  sizes="320px"
                />
              </div>
            ) : (
              <div className="relative mb-2 h-40 w-full max-w-xs overflow-hidden rounded-md">
                <Image
                  src={resolvedPreviewSrc}
                  alt="Uploaded preview"
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="320px"
                />
              </div>
            )
          ) : (
            <div className="mb-2 flex size-12 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm">
              <CloudUpload className="size-6 text-slate-400" />
            </div>
          )}
          <p className="text-sm font-semibold text-slate-900">
            {isUploading ? "Uploading..." : value || placeholder}
          </p>
          <p className="max-w-50 text-xs text-slate-500">{description}</p>
          {uploadError ? (
            <p className="text-xs text-destructive">{uploadError}</p>
          ) : null}
          {value ? (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-md border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                Clear
              </button>
              <span className="text-xs text-muted-foreground">
                Click card to re-upload
              </span>
            </div>
          ) : null}
        </div>

        {value && (
          <div className="absolute top-2 right-2">
            <div className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white">
              Selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
