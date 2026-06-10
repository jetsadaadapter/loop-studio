"use client";

import type { ScrapedJobItem } from "../../../tool-job-utils";
import { OutputCell } from "../table/cell-renderer";

interface OutputOverviewTableProps {
  items: ScrapedJobItem[];
  startIndex: number;
}

export function OutputOverviewTable({ items, startIndex }: OutputOverviewTableProps) {
  return (
    <div className="min-w-full inline-block align-middle overflow-x-auto bg-white/50">
      <table className="min-w-full divide-y divide-slate-200/60">
        <thead className="bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10 text-[10px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200/60">
          <tr>
            <th scope="col" className="w-12 px-4 py-3.5 text-slate-400 text-center">#</th>
            <th scope="col" className="px-4 py-3.5">
              <div className="flex flex-col gap-1">
                <span className="text-slate-700">Media</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">media</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5">
              <div className="flex flex-col gap-1">
                <span className="text-slate-700">Post url</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">url</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5 min-w-70">
              <div className="flex flex-col gap-1">
                <span className="text-slate-700">Post text</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">text</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-slate-700">Sentiment</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">sentiment</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5 min-w-70">
              <div className="flex flex-col gap-1">
                <span className="text-slate-700">AI Summary</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">summary</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5 min-w-40">
              <div className="flex flex-col gap-1">
                <span className="text-slate-700">Keywords</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">keywords</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap min-w-32.5">
              <div className="flex flex-col items-end gap-1">
                <span className="text-slate-700">Number of likes</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">likes</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap min-w-35">
              <div className="flex flex-col items-end gap-1">
                <span className="text-slate-700">Number of comments</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">comments</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap min-w-32.5">
              <div className="flex flex-col items-end gap-1">
                <span className="text-slate-700">Number of shares</span>
                <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">shares</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 bg-white text-xs font-medium text-slate-700">
          {items.map((item, idx) => (
            <tr key={`ov-row-${idx}`} className="hover:bg-slate-50/40 transition-colors duration-150 even:bg-slate-50/20">
              <td className="px-4 py-4 text-slate-400 font-semibold text-center border-r border-slate-200/60 bg-slate-50/40 select-none">
                {startIndex + idx + 1}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <OutputCell
                  value={item.media || (item as Record<string, unknown>).profilePicture}
                  columnKey={item.media ? "media" : (item as Record<string, unknown>).profilePicture ? "profilePicture" : "media"}
                />
              </td>
              <td className="px-4 py-4">
                <OutputCell value={item.url || item.facebookUrl || (item as Record<string, unknown>).commentUrl} columnKey="url" />
              </td>
              <td className="px-4 py-4">
                <OutputCell
                  value={item.text || (item as Record<string, unknown>).message || (item as Record<string, unknown>).caption}
                  columnKey="text"
                  authorName={(item as Record<string, unknown>).profileName as string}
                />
              </td>
              <td className="px-4 py-4 text-center">
                <OutputCell value={item.analysis?.sentiment} columnKey="sentiment" />
              </td>
              <td className="px-4 py-4">
                <OutputCell
                  value={item.analysis?.summary}
                  columnKey="summary"
                />
              </td>
              <td className="px-4 py-4">
                <OutputCell value={item.analysis?.keywords} columnKey="keywords" />
              </td>
              <td className="px-4 py-4 text-right font-sans text-slate-900 font-semibold">
                {(() => {
                  const likes = item.likes !== undefined
                    ? item.likes
                    : (item as Record<string, unknown>).likesCount !== undefined
                      ? Number((item as Record<string, unknown>).likesCount)
                      : undefined;
                  return likes !== undefined && !isNaN(likes) ? likes.toLocaleString() : "-";
                })()}
              </td>
              <td className="px-4 py-4 text-right font-sans text-slate-900 font-semibold">
                {(() => {
                  const count = item.commentsCount !== undefined
                    ? item.commentsCount
                    : typeof item.comments === "number"
                      ? item.comments
                      : Array.isArray(item.comments)
                        ? item.comments.length
                        : undefined;
                  return count !== undefined ? count.toLocaleString() : "-";
                })()}
              </td>
              <td className="px-4 py-4 text-right font-sans text-slate-900 font-semibold">
                {item.shares !== undefined ? item.shares.toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
