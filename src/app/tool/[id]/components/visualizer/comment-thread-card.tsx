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
        "bg-white border rounded-2xl p-5 shadow-3xs transition-all duration-300 hover:shadow-xs",
        isReply 
          ? "border-slate-150 hover:border-slate-250 bg-slate-50/20" 
          : "border-slate-200/60 hover:border-slate-350 hover:-translate-y-0.5"
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
                  className="text-xs font-bold text-slate-850 hover:text-brand hover:underline truncate"
                >
                  {item.profileName || "Facebook User"}
                </a>
              ) : (
                <span className="text-xs font-bold text-slate-850 truncate">
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
        <p className="mt-3.5 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap wrap-break-word select-text">
          {item.text}
        </p>

        {/* Action Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-450 uppercase tracking-wider select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ThumbsUp className="size-3 text-slate-400" />
              <span>{itemLikes.toLocaleString()} likes</span>
            </span>
            {!isReply && replyCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3 text-slate-400" />
                <span>{replyCount.toLocaleString()} replies</span>
              </span>
            )}
          </div>
          {item.commentUrl && (
            <a
              href={item.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-450 hover:text-brand hover:underline transition-colors"
            >
              <span>View source</span>
              <ExternalLink className="size-3 shrink-0" />
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
          <div className="absolute left-3.5 top-0 bottom-6 w-0.5 bg-slate-200 rounded-full select-none pointer-events-none" />
          
          <div className="space-y-3">
            {replies.map((reply, rIdx) => (
              <div key={`reply-${reply.id || rIdx}`} className="relative">
                {/* Horizontal branch line curve */}
                <div className="absolute -left-2.5 top-5 w-2.5 h-0.5 bg-slate-200 select-none pointer-events-none" />
                {renderCommentBody(reply, true)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
