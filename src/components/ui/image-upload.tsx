"use client";

import * as React from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  description?: string;
  className?: string;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  placeholder = "Upload file",
  description = "Drag or drop your files here or click to upload",
  className,
  label,
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mocking the upload by setting the file name as the ID
      // In a real app, you'd upload the file and get an ID back
      onChange?.(file.name);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white p-6 transition-colors hover:bg-slate-50 cursor-pointer",
          value && "border-brand bg-brand/5"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />
        
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 mb-2">
            <CloudUpload className="size-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {value || placeholder}
          </p>
          <p className="text-xs text-slate-500 max-w-[200px]">
            {description}
          </p>
        </div>

        {value && (
          <div className="absolute top-2 right-2">
            <div className="rounded-full bg-brand px-2 py-0.5 text-[10px] text-white">
              Selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
