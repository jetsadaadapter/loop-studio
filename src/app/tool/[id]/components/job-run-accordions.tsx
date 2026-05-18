"use client";

import { JobSettingsAccordion } from "./job-settings-accordion";
import { JobInputsAccordion } from "./job-inputs-accordion";

import type { PreviousResults } from "../tool-job-utils";

type JobRunAccordionsProps = {
  configActorId: string;
  configModelWithFallback: string;
  configItemKey: string;
  hasItemKey: boolean;
  configPrompt: string;
  copiedPrompt: boolean;
  onCopyPrompt: () => void;
  otherParams: Array<[string, unknown]>;
  hasPreviousResults: boolean;
  previousResults: PreviousResults | null | undefined;
  resolvedTargetUrls: string[];
  hasTargetUrls: boolean;
  otherInputParams: Array<[string, unknown]>;
  hasInputParams: boolean;
};

export function JobRunAccordions({
  configActorId,
  configModelWithFallback,
  configItemKey,
  hasItemKey,
  configPrompt,
  copiedPrompt,
  onCopyPrompt,
  otherParams,
  hasPreviousResults,
  previousResults,
  resolvedTargetUrls,
  hasTargetUrls,
  otherInputParams,
  hasInputParams,
}: JobRunAccordionsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden transition-all duration-300">
      <JobSettingsAccordion
        configActorId={configActorId}
        configModelWithFallback={configModelWithFallback}
        configItemKey={configItemKey}
        hasItemKey={hasItemKey}
        configPrompt={configPrompt}
        copiedPrompt={copiedPrompt}
        onCopyPrompt={onCopyPrompt}
        otherParams={otherParams}
      />

      <JobInputsAccordion
        hasPreviousResults={hasPreviousResults}
        previousResults={previousResults}
        resolvedTargetUrls={resolvedTargetUrls}
        hasTargetUrls={hasTargetUrls}
        otherInputParams={otherInputParams}
        hasInputParams={hasInputParams}
      />
    </div>
  );
}
