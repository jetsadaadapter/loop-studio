"use client";

import { useMemo } from "react";

interface PromptDetectionBarProps {
  text: string;
}

export function PromptDetectionBar({ text }: PromptDetectionBarProps) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Extract standard URLs using regex
  const urlCount = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s,]+)/g;
    const matches = trimmed.match(urlRegex);
    return matches ? matches.length : 0;
  }, [trimmed]);

  // Map high-fidelity keywords in Thai and English to intent labels
  const intentLabel = useMemo(() => {
    const lowerText = trimmed.toLowerCase();

    const hasSentiment =
      lowerText.includes("sentiment") ||
      lowerText.includes("ความรู้สึก") ||
      lowerText.includes("ทัศนคติ") ||
      lowerText.includes("เชิงลบ") ||
      lowerText.includes("เชิงบวก");

    const hasPurchase =
      lowerText.includes("ซื้อ") ||
      lowerText.includes("ขาย") ||
      lowerText.includes("สนใจ") ||
      lowerText.includes("ลูกค้า") ||
      lowerText.includes("ความตั้งใจซื้อ");

    const hasSummary =
      lowerText.includes("สรุป") ||
      lowerText.includes("ภาพรวม") ||
      lowerText.includes("สรุปประเด็น");

    if (hasPurchase && hasSentiment) {
      return "วัดความตั้งใจซื้อและ sentiment...";
    }
    if (hasSentiment) {
      return "วิเคราะห์ Sentiment และทัศนคติ...";
    }
    if (hasPurchase) {
      return "วิเคราะห์ความตั้งใจซื้อสินค้า...";
    }
    if (hasSummary) {
      return "วิเคราะห์และสรุปภาพรวมความคิดเห็น...";
    }

    return "วิเคราะห์ข้อมูลทั่วไป...";
  }, [trimmed]);

  return (
    <div className="bg-rose-50/45 border border-rose-100/60 rounded-2xl p-3 flex items-center flex-wrap gap-2.5 text-xs font-semibold text-rose-700/90 transition-all duration-300 select-none shadow-2xs">
      <span className="text-rose-600 flex items-center gap-1 font-extrabold tracking-wide">
        ✦ Detected:
      </span>
      {urlCount > 0 && (
        <span className="bg-white border border-rose-100/60 text-rose-700 px-2.5 py-0.5 rounded-lg shadow-3xs text-[10.5px] font-bold">
          {urlCount} {urlCount > 1 ? "URLs" : "URL"}
        </span>
      )}
      {intentLabel && (
        <span className="bg-white border border-rose-100/60 text-rose-700 px-2.5 py-0.5 rounded-lg shadow-3xs text-[10.5px] font-bold truncate max-w-xs sm:max-w-md">
          {intentLabel}
        </span>
      )}
    </div>
  );
}
