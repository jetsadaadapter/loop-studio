import React from "react";
import { cn } from "../../../../../lib/utils";

export const TAG_PALETTES = [
  {
    bg: "bg-indigo-50/70",
    text: "text-indigo-700",
    border: "border-indigo-100",
    hover: "hover:bg-indigo-100/80",
  },
  {
    bg: "bg-emerald-50/70",
    text: "text-emerald-700",
    border: "border-emerald-100",
    hover: "hover:bg-emerald-100/80",
  },
  {
    bg: "bg-rose-50/70",
    text: "text-rose-700",
    border: "border-rose-100",
    hover: "hover:bg-rose-100/80",
  },
  {
    bg: "bg-sky-50/70",
    text: "text-sky-700",
    border: "border-sky-100",
    hover: "hover:bg-sky-100/80",
  },
  {
    bg: "bg-amber-50/70",
    text: "text-amber-700",
    border: "border-amber-100",
    hover: "hover:bg-amber-100/80",
  },
  {
    bg: "bg-violet-50/70",
    text: "text-violet-750",
    border: "border-violet-100",
    hover: "hover:bg-violet-100/80",
  },
  {
    bg: "bg-fuchsia-50/70",
    text: "text-fuchsia-700",
    border: "border-fuchsia-100",
    hover: "hover:bg-fuchsia-100/80",
  },
];

export const getTagColors = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_PALETTES.length;
  return TAG_PALETTES[index];
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export function mockTranslate(text?: string): string {
  if (!text) return "";
  const cleanText = text.trim();
  if (cleanText.includes("Lorem ipsum dolor sit amet")) {
    return "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ออร์นาเร เลคตัส ซิท อาเมท เอส พลาเซรัต อิน เอเกสตาส เอรัต อิมเปอร์เดียต เทลลัส อินทิเกอร์ ฟิวกิแอต สเกเลอริสเก้ วา...";
  }
  if (cleanText.includes("Duis aute irure dolor")) {
    return "ไม่มีใครรักความเจ็บปวดด้วยตัวมันเอง หรือต้องการจะมีมัน หรือไล่ตามมัน เพียงเพราะว่ามันคือความเจ็บปวด...";
  }
  const isThai = /[\u0e00-\u0e7f]/.test(text);
  if (isThai) {
    return "This is a mock English translation of the comment. The system is displaying simulated translated text.";
  } else {
    return "นี่คือข้อความแปลภาษาไทยแบบจำลองของความคิดเห็นนี้ ระบบกำลังแสดงผลข้อความแปลจำลอง";
  }
}

export const renderCommentText = (text?: string) => {
  if (!text) return null;

  const regex = /(https?:\/\/[^\s]+|www\.[^\s]+|#[a-zA-Z0-9_\u0e00-\u0e7f]+)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//) || part.match(/^www\./)) {
      const href = part.startsWith("www.") ? `https://${part}` : part;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline font-medium break-all"
        >
          {part}
        </a>
      );
    } else if (part.startsWith("#")) {
      const tagText = part.slice(1);
      const colors = getTagColors(tagText);
      return (
        <span
          key={i}
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold mx-0.5 select-all border transition-colors cursor-default",
            colors.bg,
            colors.text,
            colors.border,
            colors.hover
          )}
        >
          #{tagText}
        </span>
      );
    }
    return part;
  });
};
