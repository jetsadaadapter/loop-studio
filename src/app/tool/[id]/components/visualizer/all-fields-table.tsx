"use client";

import { cn } from "@/lib/utils";
import type { ScrapedJobItem } from "../../tool-job-utils";
import { OutputCell, getHeaderLabel } from "./cell-renderer";
import {
  getValue,
  getHeaderColClass,
  getCellColClass,
} from "./tab-output-helpers";

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
    <div className="min-w-full inline-block align-middle overflow-x-auto bg-white">
      <table className="min-w-full divide-y divide-slate-100 border-b border-slate-200">
        <thead className="bg-slate-50/80 sticky top-0 z-10 text-[10.5px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200">
          <tr>
            <th
              scope="col"
              className="w-12 px-4 py-3 text-slate-400 text-center"
            >
              #
            </th>
            {allKeys.map((key) => (
              <th
                key={`all-header-${key}`}
                scope="col"
                className={cn("px-4 py-3", getHeaderColClass(key))}
              >
                <div className="flex flex-col">
                  <span className="text-slate-650">
                    {getHeaderLabel(key)}
                  </span>
                  <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">
                    {key}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold text-slate-700">
          {paginatedItems.map((item, idx) => (
            <tr
              key={`all-row-${idx}`}
              className="hover:bg-slate-50/60 transition-colors even:bg-slate-50/20"
            >
              <td className="px-4 py-3.5 text-slate-400 font-bold text-center border-r border-slate-150 bg-slate-50/30 select-none">
                {startIndex + idx + 1}
              </td>
              {allKeys.map((key) => (
                <td
                  key={`all-cell-${idx}-${key}`}
                  className={cn("px-4 py-3.5", getCellColClass(key))}
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
