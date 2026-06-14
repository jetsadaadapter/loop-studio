"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { cn } from "@/lib/utils";
import { formatDate, renderCommentText } from "./comment-helpers";

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
  dislikesCount?: string | number;
  commentsCount?: number;
  threadingDepth?: number;
  comments?: CommentItem[];
  error?: string;
}

interface CommentBodyProps {
  item: CommentItem;
  isReply?: boolean;
}

function CommentBody({ item, isReply = false }: CommentBodyProps) {
  const isErrorComment = !!item.error;
  const errorMsg = item.error || "";

  const itemLikes = item.likesCount !== undefined ? Number(item.likesCount) : 0;
  const itemDislikes = item.dislikesCount !== undefined ? Number(item.dislikesCount) : 0;
  
  const replies = item.comments || [];
  const replyCount = item.commentsCount !== undefined ? item.commentsCount : replies.length;

  if (isErrorComment) {
    return (
      <div className={cn("flex gap-2.5 py-3 px-4 bg-rose-50/20 border border-rose-100/70 rounded-xl relative animate-fade-in select-text", isReply && "py-2.5")}>
        <AlertCircle className="size-4.5 text-rose-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider mb-0.5">
            Analysis Error
          </p>
          <p className="text-xs text-rose-700 font-medium leading-relaxed">
            {errorMsg || "No result returned by Gemini"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2.5 py-2 group relative", isReply && "py-1.5")}>
      <div className={cn(
        "rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0 select-none shadow-4xs",
        isReply ? "size-7" : "size-8"
      )}>
        <ImageWithFallback
          src={item.profilePicture}
          alt={item.profileName || "User"}
          className="size-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            {item.profileUrl ? (
              <a
                href={item.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-bold text-slate-800 hover:text-brand hover:underline truncate max-w-48"
              >
                {item.profileName || "User"}
              </a>
            ) : (
              <span className="text-[12px] font-bold text-slate-800 truncate max-w-48">
                {item.profileName || "User"}
              </span>
            )}
            <span className="text-[10.5px] text-slate-400 font-medium whitespace-nowrap">
              {formatDate(item.date)}
            </span>
          </div>
        </div>

        <div className="mt-0.5 text-[12.5px] text-slate-700 leading-relaxed font-normal whitespace-pre-wrap wrap-break-word select-text">
          {renderCommentText(item.text)}
        </div>

        <div className="mt-2 flex items-center gap-3.5 text-xs font-semibold text-slate-500 select-none">
          <button className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer group/btn">
            <ThumbsUp className="size-3.5 text-emerald-500 group-hover/btn:text-emerald-600" />
            <span className="text-[10.5px] font-bold">{itemLikes > 0 ? itemLikes.toLocaleString() : "0"}</span>
          </button>

          <button className="flex items-center gap-1 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer group/btn">
            <ThumbsDown className="size-3.5 text-rose-500 group-hover/btn:text-rose-600" />
            <span className="text-[10.5px] font-bold">{itemDislikes > 0 ? itemDislikes.toLocaleString() : "0"}</span>
          </button>

          <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer group/btn">
            <MessageSquare className="size-3.5 text-slate-400 group-hover/btn:text-slate-500" />
            <span className="text-[10.5px]">Reply {replyCount > 0 ? `(${replyCount})` : ""}</span>
          </button>

          {item.commentUrl && (
            <a
              href={item.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10.5px] text-slate-400 hover:text-slate-600 transition-colors ml-auto"
            >
              <span>View source</span>
              <ExternalLink className="size-3 text-slate-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface CommentThreadCardProps {
  comment: CommentItem;
}

export function CommentThreadCard({ comment }: CommentThreadCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const replies = comment.comments || [];
  const replyCount = comment.commentsCount !== undefined ? comment.commentsCount : replies.length;

  return (
    <div className="w-full border-b border-slate-100 last:border-b-0 pb-2">
      <CommentBody item={comment} isReply={false} />

      {replies.length > 0 && (
        <div className="pl-[42px] mt-0.5">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-brand hover:text-brand-strong transition-colors font-bold text-xs cursor-pointer select-none py-0.5"
          >
            <span className="text-[10px] transform transition-transform duration-200">
              {showReplies ? "▲" : "▼"}
            </span>
            <span>
              {showReplies ? "Hide replies" : `See ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
            </span>
          </button>
        </div>
      )}

      {showReplies && replies.length > 0 && (
        <div className="relative pl-[42px] mt-1">
          <div className="absolute left-[16px] top-0 bottom-6 w-0.5 bg-slate-150 rounded-full select-none pointer-events-none" />

          <div className="space-y-0.5">
            {replies.map((reply, rIdx) => (
              <div key={`reply-${reply.id || rIdx}`} className="relative">
                <div className="absolute -left-[26px] top-5 w-[26px] h-0.5 bg-slate-150 select-none pointer-events-none" />
                <CommentBody item={reply} isReply={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
