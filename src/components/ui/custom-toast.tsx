"use client";

import React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { Check, Info, AlertTriangle, X } from "lucide-react";

export const customToast = {
  success: (message: React.ReactNode, options?: ExternalToast) => {
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-center gap-3.5 w-fit min-w-[260px] max-w-[400px] bg-emerald-50/90 border border-emerald-100/70 p-4 rounded-2xl shadow-sm text-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="size-3" strokeWidth={3} />
          </div>
          <div className="text-xs font-normal leading-relaxed text-emerald-800 break-words flex-1">
            {message}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  info: (message: React.ReactNode, options?: ExternalToast) => {
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-center gap-3.5 w-fit min-w-[260px] max-w-[400px] bg-blue-50/90 border border-blue-100/70 p-4 rounded-2xl shadow-sm text-blue-800 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Info className="size-3" strokeWidth={3} />
          </div>
          <div className="text-xs font-normal leading-relaxed text-blue-800 break-words flex-1">
            {message}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-blue-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  warning: (message: React.ReactNode, options?: ExternalToast) => {
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-center gap-3.5 w-fit min-w-[260px] max-w-[400px] bg-amber-50/90 border border-amber-100/70 p-4 rounded-2xl shadow-sm text-amber-800 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="size-3" strokeWidth={3} />
          </div>
          <div className="text-xs font-normal leading-relaxed text-amber-800 break-words flex-1">
            {message}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-amber-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  error: (message: React.ReactNode, options?: ExternalToast) => {
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-center gap-3.5 w-fit min-w-[260px] max-w-[400px] bg-red-50/90 border border-red-100/70 p-4 rounded-2xl shadow-sm text-red-800 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <X className="size-3" strokeWidth={3} />
          </div>
          <div className="text-xs font-normal leading-relaxed text-red-800 break-words flex-1">
            {message}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-red-400 hover:text-red-600 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  loading: (message: React.ReactNode, options?: ExternalToast) => sonnerToast.loading(message, options),
  custom: sonnerToast.custom,
  promise: <TData = any>(
    promise: Promise<TData> | (() => Promise<TData>),
    options: {
      loading: React.ReactNode;
      success: any;
      error: any;
    }
  ) => {
    const toastId = sonnerToast.custom((id) => (
      <div className="flex items-center gap-3.5 w-fit min-w-[260px] max-w-[400px] bg-slate-50/90 border border-slate-200/70 p-4 rounded-2xl shadow-sm text-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <svg className="animate-spin h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div className="text-xs font-normal leading-relaxed text-slate-600 break-words flex-1">
          {options.loading}
        </div>
        <button
          type="button"
          onClick={() => sonnerToast.dismiss(id)}
          className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 ml-1"
        >
          <X className="size-3" />
        </button>
      </div>
    ));

    const actualPromise = typeof promise === "function" ? promise() : promise;

    actualPromise
      .then((data) => {
        sonnerToast.dismiss(toastId);
        const successMsg = typeof options.success === "function"
          ? (options.success as Function)(data)
          : options.success;
        customToast.success(successMsg);
      })
      .catch((err) => {
        sonnerToast.dismiss(toastId);
        const errorMsg = typeof options.error === "function"
          ? (options.error as Function)(err)
          : options.error;
        customToast.error(errorMsg);
      });

    return toastId;
  },
};
