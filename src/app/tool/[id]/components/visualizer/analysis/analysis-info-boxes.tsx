"use client";

import { cn } from "@/lib/utils";

interface AnalysisInfoBoxesProps {
  classification?: string;
  confidence?: string | number | null;
  purchaseSignal?: boolean;
  variant?: 'plain' | 'semantic';
  classificationTone?: string;
}

export function AnalysisInfoBoxes({
  classification,
  confidence,
  purchaseSignal,
  variant = 'plain',
  classificationTone = "bg-white border-slate-200"
}: AnalysisInfoBoxesProps) {
  const showClassification = !!classification;
  const showConfidence = confidence !== null && confidence !== undefined;
  const showPurchaseSignal = purchaseSignal === true || purchaseSignal === false;
  const visibleBoxesCount = [showClassification, showConfidence, showPurchaseSignal].filter(Boolean).length;

  if (visibleBoxesCount === 0) return null;

  const isPlain = variant === 'plain';
  const gapClass = isPlain ? "gap-2.5" : "gap-3";
  const paddingClass = isPlain ? "px-3 py-2.5" : "px-4 py-3";
  const labelSize = isPlain ? "text-[9px]" : "text-[10px]";
  const valueWeight = isPlain ? "font-black" : "font-bold";
  const valueMt = isPlain ? "mt-1" : "mt-1.5";

  return (
    <div className={cn("flex flex-wrap", gapClass)}>
      {showClassification && (
        <div className={cn(
          "rounded-xl border shadow-xs flex-1 sm:flex-initial sm:min-w-[180px] sm:max-w-[240px]",
          paddingClass,
          isPlain ? "bg-white border-slate-200" : classificationTone
        )}>
          <p className={cn(
            labelSize,
            "font-bold uppercase tracking-wider",
            isPlain ? "text-slate-400" : "opacity-70"
          )}>
            Classification
          </p>
          <p className={cn(
            valueMt,
            "text-sm leading-tight",
            valueWeight,
            isPlain ? "text-slate-800" : ""
          )}>
            {classification}
          </p>
        </div>
      )}

      {showConfidence && (
        <div className={cn(
          "rounded-xl border shadow-xs flex-1 sm:flex-initial sm:min-w-[180px] sm:max-w-[240px]",
          paddingClass,
          isPlain ? "bg-white border-slate-200" : "bg-slate-50/50 border-slate-200/60"
        )}>
          <p className={cn(
            labelSize,
            "font-bold uppercase tracking-wider",
            isPlain ? "text-slate-400" : "text-slate-500"
          )}>
            Confidence
          </p>
          <p className={cn(
            valueMt,
            "text-sm leading-tight text-slate-800",
            valueWeight
          )}>
            {confidence}
          </p>
        </div>
      )}

      {showPurchaseSignal && (
        <div className={cn(
          "rounded-xl border shadow-xs flex-1 sm:flex-initial sm:min-w-[180px] sm:max-w-[240px]",
          paddingClass,
          isPlain ? "bg-white border-slate-200" :
            purchaseSignal === true ? "bg-emerald-50 border-emerald-200/60 text-emerald-700" :
              "bg-slate-50 border-slate-200/60 text-slate-600"
        )}>
          <p className={cn(
            labelSize,
            "font-bold uppercase tracking-wider",
            isPlain ? "text-slate-400" : "opacity-70"
          )}>
            Purchase Signal
          </p>
          <p className={cn(
            valueMt,
            "text-sm leading-tight",
            valueWeight,
            isPlain ? "text-slate-800" : ""
          )}>
            {purchaseSignal === true ? "Yes" : "No"}
          </p>
        </div>
      )}
    </div>
  );
}
