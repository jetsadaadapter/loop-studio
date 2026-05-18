"use client";

import { useState } from "react";
import { List, ChevronDown, ChevronUp, Repeat, ExternalLink } from "lucide-react";

import type { PreviousResults } from "../tool-job-utils";

type JobInputsAccordionProps = {
  hasPreviousResults: boolean;
  previousResults: PreviousResults | null | undefined;
  resolvedTargetUrls: string[];
  hasTargetUrls: boolean;
  otherInputParams: Array<[string, unknown]>;
  hasInputParams: boolean;
};

export function JobInputsAccordion({
  hasPreviousResults,
  previousResults,
  resolvedTargetUrls,
  hasTargetUrls,
  otherInputParams,
  hasInputParams,
}: JobInputsAccordionProps) {
  const [showInput, setShowInput] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowInput(!showInput)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <List className="size-3.5 text-slate-500" />
          <span className="text-[11px] font-bold text-slate-700">
            Inspect Tool Run Inputs
          </span>
        </div>
        {showInput ? (
          <ChevronUp className="size-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="size-3.5 text-slate-400" />
        )}
      </button>

      {showInput && (
        <div className="p-3.5 bg-white space-y-3.5 text-xs">
          {/* Chained Workflow Reference Block */}
          {hasPreviousResults && previousResults && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                Chained Workflow Reference
              </span>
              <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border border-blue-100 rounded-xl p-3 space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500 text-white rounded-md shrink-0">
                    <Repeat className="size-3" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wide block leading-none">
                      Workflow Input Source
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-800 break-all block text-ellipsis overflow-hidden">
                      {previousResults.actorId || "Chained Job Result"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100/50 text-[9px]">
                  <div>
                    <span className="text-slate-400 font-bold uppercase block mb-0.5">
                      Reference Result ID
                    </span>
                    <span className="font-semibold text-slate-755 break-all bg-white border border-slate-100 px-1 py-0.5 rounded-md shadow-xs block">
                      {previousResults.resultId || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase block mb-0.5">
                      Reference Run ID
                    </span>
                    <span className="font-semibold text-slate-755 break-all bg-white border border-slate-100 px-1 py-0.5 rounded-md shadow-xs block">
                      {previousResults.runId || "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2 pt-0.5">
                    <div className="flex justify-between items-center bg-white border border-slate-100 px-2 py-1 rounded-md shadow-xs">
                      <span className="text-slate-500 font-medium">
                        Chained Items Count
                      </span>
                      <span className="font-bold text-blue-700">
                        {previousResults.itemCount ??
                          previousResults.items?.length ??
                          0}{" "}
                        Items
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Target URLs List */}
          {hasTargetUrls && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                {hasPreviousResults ? "Chained Target URLs" : "Start Target URLs"}
              </span>
              <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                {resolvedTargetUrls.map((rawUrl, idx) => {
                  let decodedUrl = rawUrl;
                  try {
                    decodedUrl = decodeURIComponent(rawUrl);
                  } catch {}

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg transition-all min-w-0"
                    >
                      <ExternalLink className="size-3 text-brand shrink-0" />
                      <a
                        href={rawUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-slate-700 hover:text-brand hover:underline truncate leading-normal"
                      >
                        {decodedUrl}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Input keys */}
          {otherInputParams.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                Input Configuration Parameters
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100">
                {otherInputParams.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-0.5 min-w-0 text-[9.5px]"
                  >
                    <span className="text-slate-500 font-medium truncate mr-2 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="font-bold text-slate-700 shrink-0 bg-white border border-slate-150 px-1.5 py-0.5 rounded-md shadow-xs">
                      {typeof val === "boolean"
                        ? val
                          ? "True"
                          : "False"
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasInputParams ? (
            <p className="text-slate-400 text-center py-2 text-[10px]">
              No input parameters configured for this job.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
