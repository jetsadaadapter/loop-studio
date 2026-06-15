"use client";

import { ListOrdered, Tag } from "lucide-react";
import { DynamicUISection } from "../types";

interface ListCommentData {
  comment: string;
  keywords_mentioned?: string[];
}

export function ListRenderer({ section }: { section: DynamicUISection }) {
  const data = section.data as ListCommentData[] | undefined;
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    // Blueprint mode - show sorting strategy
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          การจัดลำดับข้อมูล (Feed Sorting Strategy)
        </p>
        <div className="flex gap-3 bg-white p-3 rounded-xl border border-slate-100 items-start shadow-3xs">
          <span className="p-2 bg-brand/5 text-brand rounded-lg shrink-0 border border-brand/10">
            <ListOrdered className="size-4" />
          </span>
          <div className="space-y-1">
            <h6 className="text-xs font-bold text-slate-800">
              วิเคราะห์ฟีดข้อความเจตนา
            </h6>
            <p className="text-[11px] text-slate-450 leading-relaxed">
              สกัดฟีดความคิดเห็น (Feed list) ที่ตรงตามเงื่อนไขที่คัดกรอง 
              โดยประเมินลำดับความสำคัญ (Priority: {section.priority}) 
              เพื่อแสดงรายละเอียดข้อความและคีย์เวิร์ดที่จับคู่สัญญาณได้
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-3 bg-white hover:bg-slate-50/20 border border-slate-200/50 rounded-xl hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="flex items-center justify-center size-5 shrink-0 rounded-full bg-brand/10 text-brand text-[10px] font-extrabold select-none border border-brand/20 shadow-3xs">
            {idx + 1}
          </span>
          <div className="flex-1 space-y-1.5 min-w-0">
            <p className="text-xs font-semibold text-slate-700 leading-relaxed break-words select-text">
              {item.comment}
            </p>
            {Array.isArray(item.keywords_mentioned) && item.keywords_mentioned.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 select-none pt-0.5">
                <Tag className="size-2.5 text-slate-400 shrink-0" />
                {item.keywords_mentioned.map((kw, kwIdx) => (
                  <span
                    key={kwIdx}
                    className="inline-flex items-center rounded-lg bg-brand/5 px-2 py-0.5 text-[9px] font-bold text-brand border border-brand/10 shadow-3xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
