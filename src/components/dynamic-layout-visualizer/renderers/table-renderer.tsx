"use client";

import { DynamicUISection } from "../types";

export function TableRenderer({ section }: { section: DynamicUISection }) {
  const data = section.data as Record<string, unknown>[] | undefined;
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    // Blueprint mode - show columns schema mapping
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          โครงสร้างตารางข้อมูล (Grid Schema)
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-150 border-dashed bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 select-none">
                <th className="p-3 font-extrabold text-slate-450 uppercase text-[10px]">ชื่อคอลัมน์ (Column)</th>
                <th className="p-3 font-extrabold text-slate-455 uppercase text-[10px]">ประเภทข้อมูล (Type)</th>
                <th className="p-3 font-extrabold text-slate-455 uppercase text-[10px]">คำอธิบายพารามิเตอร์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="p-3 font-bold text-slate-700">Comment Text</td>
                <td className="p-3 text-slate-450"><code>String</code></td>
                <td className="p-3 text-slate-500">ข้อความความคิดเห็นดั้งเดิมที่นำมาคัดกรอง</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700">Matched Signals</td>
                <td className="p-3 text-slate-450"><code>String[]</code></td>
                <td className="p-3 text-slate-500">สัญญาณคีย์เวิร์ดที่จับคู่ได้</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700">Sentiment Score</td>
                <td className="p-3 text-slate-450"><code>Enum [pos, neu, neg]</code></td>
                <td className="p-3 text-slate-500">ระดับความรู้สึกที่ประเมินโดยโมเดล AI</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Active data mode - extract columns dynamically from all row keys to ensure completeness
  const allKeys = new Set<string>();
  for (const row of data) {
    if (row && typeof row === "object") {
      for (const key of Object.keys(row)) {
        if (!key.startsWith("_") && key !== "id" && key !== "section_id" && key !== "section_type" && key !== "row_id") {
          allKeys.add(key);
        }
      }
    }
  }
  const columnsList = Array.from(allKeys);
  const columns = [
    ...(columnsList.includes("label") ? ["label"] : []),
    ...(columnsList.includes("value") ? ["value"] : []),
    ...columnsList.filter((k) => k !== "label" && k !== "value"),
  ];

  const formatHeader = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderCell = (col: string, val: unknown) => {
    if (val === null || val === undefined) return <span className="text-slate-300">—</span>;

    // If it's an array, render inline badges
    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600 border border-slate-200/60 shadow-3xs"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    const strVal = String(val).trim();
    const cleanCol = col.toLowerCase();
    const cleanVal = strVal.toLowerCase();

    // Check if the value is a URL and render as a clean shortened link
    if (strVal.startsWith("http://") || strVal.startsWith("https://")) {
      let displayUrl = strVal;
      try {
        const urlObj = new URL(strVal);
        const host = urlObj.hostname.replace("www.", "");
        let path = urlObj.pathname;
        try {
          path = decodeURIComponent(path);
        } catch {}
        if (path === "/") {
          displayUrl = host;
        } else {
          if (path.length > 35) {
            path = path.slice(0, 35) + "...";
          }
          displayUrl = `${host}${path}`;
        }
      } catch {
        if (displayUrl.length > 45) {
          displayUrl = displayUrl.slice(0, 45) + "...";
        }
      }
      return (
        <a
          href={strVal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-brand hover:text-brand/85 hover:underline font-bold max-w-[360px] truncate select-all"
          title={strVal}
        >
          <span>{displayUrl}</span>
          <span className="text-[10px] text-slate-400 font-bold ml-0.5">↗</span>
        </a>
      );
    }

    // Check if it's a sentiment-related column or value matches standard values
    const isSentimentCol = cleanCol.includes("sentiment") || cleanCol.includes("intent") || cleanCol.includes("signal") || cleanCol.includes("status") || cleanCol.includes("label");

    if (isSentimentCol || ["อยากซื้อ", "ไม่สนใจ", "แง่ลบ", "pos", "neu", "neg", "positive", "neutral", "negative", "ทั่วไป", "อยากได้", "ไม่ซื้อ"].includes(cleanVal)) {
      // Check neutral / negative first to avoid prefix overlap (e.g. "ไม่สนใจ" matches "สนใจ", "ไม่ซื้อ" matches "ซื้อ")
      if (cleanVal.includes("ไม่สนใจ") || cleanVal === "neu" || cleanVal === "neutral" || cleanVal.includes("ทั่วไป") || cleanVal.includes("indifferent")) {
        return (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-500 border border-slate-200 shadow-3xs">
            <span className="size-1.5 rounded-full bg-slate-400 mr-1.5 shrink-0" />
            {strVal}
          </span>
        );
      }
      if (cleanVal.includes("แง่ลบ") || cleanVal === "neg" || cleanVal === "negative" || cleanVal === "ลบ" || cleanVal.includes("ไม่ซื้อ") || cleanVal === "แย่") {
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200/60 shadow-3xs">
            <span className="size-1.5 rounded-full bg-rose-500 mr-1.5 shrink-0" />
            {strVal}
          </span>
        );
      }
      if (cleanVal.includes("อยากซื้อ") || cleanVal.includes("อยากได้") || cleanVal === "pos" || cleanVal === "positive" || cleanVal === "ซื้อ") {
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200/60 shadow-3xs">
            <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0 animate-pulse" />
            {strVal}
          </span>
        );
      }
    }

    // Default formatting
    if (typeof val === "object") return <code className="text-[9.5px] text-slate-500">{JSON.stringify(val)}</code>;
    
    return <span className="text-slate-600 font-medium select-text">{strVal}</span>;
  };

  const getColumnThClass = (col: string) => {
    const c = col.toLowerCase();
    const align = c === "sentiment" || c === "percent" || c === "comment_count" || c === "count" ? "text-center" : "text-left";
    return `px-4 py-3 font-extrabold text-slate-500 uppercase tracking-wider text-[9.5px] whitespace-nowrap ${align}`;
  };

  const getColumnTdClass = (col: string) => {
    const c = col.toLowerCase();
    const align = c === "sentiment" || c === "percent" || c === "comment_count" || c === "count" ? "text-center" : "text-left";
    
    let widthClass = "";
    if (c === "label") widthClass = "whitespace-nowrap min-w-[140px]";
    else if (c === "sentiment") widthClass = "min-w-[110px]";
    else if (c === "percent") widthClass = "min-w-[80px]";
    else if (c === "comment_count" || c === "count") widthClass = "min-w-[130px]";
    else if (c === "value") widthClass = "min-w-[200px] max-w-md";
    else if (c === "note" || c === "comment") widthClass = "min-w-[220px] max-w-sm whitespace-normal";
    else widthClass = "min-w-[120px]";

    return `px-4 py-3.5 text-slate-700 leading-relaxed text-xs select-text ${align} ${widthClass}`;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white shadow-3xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/75 border-b border-slate-200/60 select-none">
            {columns.map((col) => (
              <th key={col} className={getColumnThClass(col)}>
                {formatHeader(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/30 transition-colors">
              {columns.map((col) => (
                <td key={col} className={getColumnTdClass(col)}>
                  {renderCell(col, row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
