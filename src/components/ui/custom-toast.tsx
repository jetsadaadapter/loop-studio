"use client";

import React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { Check, Info, AlertTriangle, X } from "lucide-react";

interface ToastMessageObject {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

function parseMessage(
  message: React.ReactNode,
  defaultTitle: string
): { title: React.ReactNode; description: React.ReactNode } {
  if (
    message &&
    typeof message === "object" &&
    ("title" in message || "description" in message)
  ) {
    const obj = message as ToastMessageObject;
    return {
      title: obj.title ?? defaultTitle,
      description: obj.description ?? "",
    };
  }
  return {
    title: defaultTitle,
    description: message,
  };
}

export const customToast = {
  success: (message: React.ReactNode, options?: ExternalToast) => {
    const { title, description } = parseMessage(message, "Success");
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-start gap-3 w-fit min-w-[280px] max-w-[380px] bg-white border border-emerald-200 p-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/10 mt-0.5">
            <Check className="size-3" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0 select-text">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {title}
            </h4>
            {description && (
              <p className="text-xs font-medium leading-relaxed text-slate-500 mt-0.5 break-words">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-1 rounded transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  info: (message: React.ReactNode, options?: ExternalToast) => {
    const { title, description } = parseMessage(message, "Information");
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-start gap-3 w-fit min-w-[280px] max-w-[380px] bg-white border border-slate-200 p-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm shadow-slate-800/10 mt-0.5">
            <Info className="size-3" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0 select-text">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {title}
            </h4>
            {description && (
              <p className="text-xs font-medium leading-relaxed text-slate-500 mt-0.5 break-words">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-1 rounded transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  warning: (message: React.ReactNode, options?: ExternalToast) => {
    const { title, description } = parseMessage(message, "Warning");
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-start gap-3 w-fit min-w-[280px] max-w-[380px] bg-white border border-amber-200 p-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm shadow-amber-500/10 mt-0.5">
            <AlertTriangle className="size-3" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0 select-text">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {title}
            </h4>
            {description && (
              <p className="text-xs font-medium leading-relaxed text-slate-500 mt-0.5 break-words">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-1 rounded transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  error: (message: React.ReactNode, options?: ExternalToast) => {
    const { title, description } = parseMessage(message, "Error");
    return sonnerToast.custom(
      (id) => (
        <div className="flex items-start gap-3 w-fit min-w-[280px] max-w-[380px] bg-white border border-rose-250 p-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/10 mt-0.5">
            <X className="size-3" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0 select-text">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {title}
            </h4>
            {description && (
              <p className="text-xs font-medium leading-relaxed text-slate-500 mt-0.5 break-words">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-1 rounded transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="size-3" />
          </button>
        </div>
      ),
      options
    );
  },

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  loading: (message: React.ReactNode, options?: ExternalToast) =>
    sonnerToast.loading(message, options),
  custom: sonnerToast.custom,
  promise: <TData = unknown>(
    promise: Promise<TData> | (() => Promise<TData>),
    options: {
      loading: React.ReactNode;
      success: React.ReactNode | ((data: TData) => React.ReactNode);
      error: React.ReactNode | ((error: unknown) => React.ReactNode);
    }
  ) => {
    const toastId = sonnerToast.custom((id) => (
      <div className="flex items-start gap-3 w-fit min-w-[280px] max-w-[380px] bg-white border border-slate-200 p-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm shadow-slate-800/10 mt-0.5">
          <svg
            className="animate-spin h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0 select-text">
          <h4 className="text-xs font-bold text-slate-900 leading-tight">
            Processing
          </h4>
          <p className="text-xs font-medium leading-relaxed text-slate-500 mt-0.5 break-words">
            {options.loading}
          </p>
        </div>
        <button
          type="button"
          onClick={() => sonnerToast.dismiss(id)}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-1 rounded transition-colors cursor-pointer shrink-0 ml-1"
        >
          <X className="size-3" />
        </button>
      </div>
    ));

    const actualPromise = typeof promise === "function" ? promise() : promise;

    actualPromise
      .then((data) => {
        sonnerToast.dismiss(toastId);
        const successMsg =
          typeof options.success === "function"
            ? (options.success as (data: TData) => React.ReactNode)(data)
            : options.success;
        customToast.success(successMsg);
      })
      .catch((err) => {
        sonnerToast.dismiss(toastId);
        const errorMsg =
          typeof options.error === "function"
            ? (options.error as (error: unknown) => React.ReactNode)(err)
            : options.error;
        customToast.error(errorMsg);
      });

    return toastId;
  },
};
