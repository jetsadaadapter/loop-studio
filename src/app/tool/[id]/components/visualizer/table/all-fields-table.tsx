"use client";

import { cn } from "@/lib/utils";
import type { ScrapedJobItem } from "../../../tool-job-utils";
import { OutputCell, getHeaderLabel } from "./cell-renderer";
import {
  getValue,
  getHeaderColClass,
  getCellColClass,
} from "../tabs/tab-output-helpers";

interface AllFieldsTableProps {
  paginatedItems: ScrapedJobItem[];
  allKeys: string[];
  startIndex: number;
}

export function AllFieldsTable({
  paginatedItems,
  allKeys,
  startIndex,
}: AllFieldsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white shadow-3xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/75 border-b border-slate-200/60 select-none">
          <tr>
            <th
              scope="col"
              className="w-12 px-4 py-3 text-slate-400 text-center font-extrabold text-[9.5px] uppercase tracking-wider"
            >
              #
            </th>
            {allKeys.map((key) => (
              <th
                key={`all-header-${key}`}
                scope="col"
                className={cn(
                  "px-4 py-3 font-extrabold text-slate-500 uppercase tracking-wider text-[9.5px]",
                  getHeaderColClass(key)
                )}
              >
                <div className="flex flex-col">
                  <span className="text-slate-655 font-bold">
                    {getHeaderLabel(key)}
                  </span>
                  <span className="text-slate-400 text-[8.5px] font-sans lowercase tracking-normal font-semibold mt-0.5">
                    {key}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedItems.map((item, idx) => (
            <tr
              key={`all-row-${idx}`}
              className="hover:bg-slate-50/30 transition-colors"
            >
              <td className="px-4 py-3.5 text-slate-400 font-extrabold text-center select-none text-xs border-r border-slate-150/40">
                {startIndex + idx + 1}
              </td>
              {allKeys.map((key) => (
                <td
                  key={`all-cell-${idx}-${key}`}
                  className={cn(
                    "px-4 py-3.5 text-slate-700 leading-relaxed text-xs",
                    getCellColClass(key)
                  )}
                >
                  <OutputCell
                    value={getValue(item, key)}
                    columnKey={key}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
