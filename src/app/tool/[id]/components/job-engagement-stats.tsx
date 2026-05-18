"use client";

import { Eye, Heart, MessageCircle, Repeat } from "lucide-react";

type JobEngagementStatsProps = {
  viewsCount?: number;
  likes?: number;
  commentsCount?: number;
  shares?: number;
  reactionLikeCount?: number;
  reactionLoveCount?: number;
  reactionCareCount?: number;
  reactionHahaCount?: number;
  reactionWowCount?: number;
};

export function JobEngagementStats({
  viewsCount,
  likes,
  commentsCount,
  shares,
  reactionLikeCount,
  reactionLoveCount,
  reactionCareCount,
  reactionHahaCount,
  reactionWowCount,
}: JobEngagementStatsProps) {
  const hasCounts =
    viewsCount !== undefined ||
    likes !== undefined ||
    commentsCount !== undefined ||
    shares !== undefined;

  const hasReactions =
    (reactionLikeCount !== undefined && reactionLikeCount > 0) ||
    (reactionLoveCount !== undefined && reactionLoveCount > 0) ||
    (reactionCareCount !== undefined && reactionCareCount > 0) ||
    (reactionHahaCount !== undefined && reactionHahaCount > 0) ||
    (reactionWowCount !== undefined && reactionWowCount > 0);

  if (!hasCounts && !hasReactions) return null;

  return (
    <div className="flex flex-col gap-3.5 pt-1 border-b border-slate-100/60 pb-5">
      {/* Main Counters Row */}
      {hasCounts && (
        <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold text-xs">
          {viewsCount !== undefined && (
            <span className="flex items-center gap-1.5 transition-all hover:text-slate-700 cursor-default">
              <Eye className="size-4 text-slate-450" />{" "}
              {viewsCount.toLocaleString()}
            </span>
          )}
          {likes !== undefined && (
            <span className="flex items-center gap-1.5 transition-all hover:text-rose-600 cursor-default text-rose-500">
              <Heart className="size-4 fill-rose-500 text-rose-500" />{" "}
              {likes.toLocaleString()}
            </span>
          )}
          {commentsCount !== undefined && (
            <span className="flex items-center gap-1.5 transition-all hover:text-teal-655 cursor-default text-teal-600">
              <MessageCircle className="size-4 text-teal-500 fill-teal-50" />{" "}
              {commentsCount.toLocaleString()}
            </span>
          )}
          {shares !== undefined && (
            <span className="flex items-center gap-1.5 transition-all hover:text-brand cursor-default text-slate-500">
              <Repeat className="size-4 text-slate-400 group-hover:text-brand" />{" "}
              {shares.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Facebook Reactions Emoji Pills Breakdown */}
      {hasReactions && (
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100/40 mt-1 select-none">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mr-1.5">
            Reactions
          </span>

          {reactionLikeCount !== undefined && reactionLikeCount > 0 && (
            <div className="flex items-center gap-1 bg-slate-50/60 border border-slate-200/40 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-650 shadow-2xs hover:bg-slate-100/80 transition-all duration-200 cursor-default">
              <span>👍</span>
              <span className="font-bold text-slate-800">
                {reactionLikeCount.toLocaleString()}
              </span>
            </div>
          )}
          {reactionLoveCount !== undefined && reactionLoveCount > 0 && (
            <div className="flex items-center gap-1 bg-slate-50/60 border border-slate-200/40 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-650 shadow-2xs hover:bg-slate-100/80 transition-all duration-200 cursor-default">
              <span>❤️</span>
              <span className="font-bold text-slate-800">
                {reactionLoveCount.toLocaleString()}
              </span>
            </div>
          )}
          {reactionCareCount !== undefined && reactionCareCount > 0 && (
            <div className="flex items-center gap-1 bg-slate-50/60 border border-slate-200/40 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-650 shadow-2xs hover:bg-slate-100/80 transition-all duration-200 cursor-default">
              <span>🥰</span>
              <span className="font-bold text-slate-800">
                {reactionCareCount.toLocaleString()}
              </span>
            </div>
          )}
          {reactionHahaCount !== undefined && reactionHahaCount > 0 && (
            <div className="flex items-center gap-1 bg-slate-50/60 border border-slate-200/40 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-650 shadow-2xs hover:bg-slate-100/80 transition-all duration-200 cursor-default">
              <span>😂</span>
              <span className="font-bold text-slate-800">
                {reactionHahaCount.toLocaleString()}
              </span>
            </div>
          )}
          {reactionWowCount !== undefined && reactionWowCount > 0 && (
            <div className="flex items-center gap-1 bg-slate-50/60 border border-slate-200/40 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-650 shadow-2xs hover:bg-slate-100/80 transition-all duration-200 cursor-default">
              <span>😮</span>
              <span className="font-bold text-slate-800">
                {reactionWowCount.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
