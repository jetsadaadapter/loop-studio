"use client";

import { ThumbsUp, ExternalLink, MessageCircle } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { cn } from "../../../../../lib/utils";

export interface CommentItem {
  id: string;
  commentId: string;
  commentUrl?: string;
  text?: string;
  profilePicture?: string;
  profileName?: string;
  profileUrl?: string;
  date?: string;
  likesCount?: string | number;
  commentsCount?: number;
  threadingDepth?: number;
  comments?: CommentItem[];
}

const TAG_PALETTES = [
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

const getTagColors = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_PALETTES.length;
  return TAG_PALETTES[index];
};

const renderCommentText = (text?: string) => {
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

interface CommentThreadCardProps {
  comment: CommentItem;
}

export function CommentThreadCard({ comment }: CommentThreadCardProps) {
  const replies = comment.comments || [];
  const replyCount = comment.commentsCount !== undefined ? comment.commentsCount : replies.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const renderCommentBody = (item: CommentItem, isReply: boolean = false) => {
    const itemLikes = item.likesCount !== undefined ? Number(item.likesCount) : 0;
    
    return (
      <div className={cn(
        "transition-all duration-300 border bg-white",
        isReply 
          ? "border-slate-150 hover:border-slate-250 bg-slate-50/40 rounded-xl p-3.5 shadow-3xs" 
          : "border-slate-200/50 hover:border-slate-350 hover:-translate-y-0.5 rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-xs"
      )}>
        {/* Author Header */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0 select-none shadow-4xs",
            isReply ? "size-7" : "size-9"
          )}>
            <ImageWithFallback
              src={item.profilePicture}
              alt={item.profileName || "User"}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {item.profileUrl ? (
                <a
                  href={item.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-slate-800 hover:text-brand hover:underline truncate"
                >
                  {item.profileName || "Facebook User"}
                </a>
              ) : (
                <span className="text-xs font-bold text-slate-800 truncate">
                  {item.profileName || "Facebook User"}
                </span>
              )}
              {isReply && (
                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/60 text-slate-400 text-[8px] font-extrabold uppercase rounded tracking-wider">
                  Reply
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              {formatDate(item.date)}
            </span>
          </div>
        </div>

        {/* Comment Text */}
        <p className="mt-3 text-xs text-slate-705 leading-relaxed font-normal whitespace-pre-wrap wrap-break-word select-text">
          {renderCommentText(item.text)}
        </p>

        {/* Action Row */}
        <div className="mt-3.5 pt-3 border-t border-slate-100/60 flex items-center justify-between text-[11px] font-semibold text-slate-500 select-none">
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5">
              <ThumbsUp className="size-3.5 text-slate-400" />
              <span>{itemLikes.toLocaleString()} {itemLikes === 1 ? "like" : "likes"}</span>
            </span>
            {!isReply && replyCount > 0 && (
              <span className="flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-slate-400" />
                <span>{replyCount.toLocaleString()} {replyCount === 1 ? "reply" : "replies"}</span>
              </span>
            )}
          </div>
          {item.commentUrl && (
            <a
              href={item.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-brand hover:underline transition-colors"
            >
              <span>View source</span>
              <ExternalLink className="size-3 shrink-0 text-slate-400" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Primary Comment (Depth 0) */}
      {renderCommentBody(comment, false)}

      {/* Nested Replies Branch (Depth 1) */}
      {replies.length > 0 && (
        <div className="relative pl-6 mt-3">
          {/* Visual social thread connecting vertical branch line */}
          <div className="absolute left-3.5 top-0 bottom-6 w-0.5 bg-slate-200/60 rounded-full select-none pointer-events-none" />
          
          <div className="space-y-2.5">
            {replies.map((reply, rIdx) => (
              <div key={`reply-${reply.id || rIdx}`} className="relative">
                {/* Horizontal branch line curve */}
                <div className="absolute -left-2.5 top-5 w-2.5 h-0.5 bg-slate-200/60 select-none pointer-events-none" />
                {renderCommentBody(reply, true)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
