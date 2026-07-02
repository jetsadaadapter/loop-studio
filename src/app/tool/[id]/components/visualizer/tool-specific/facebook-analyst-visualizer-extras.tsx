"use client";

import { TrendingUp, FileText, Star, Tag, User, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Comment, Insight, CardHelpers } from "./facebook-analyst-visualizer-types";
import { IndexBadge } from "./facebook-analyst-visualizer-cards";

// ─── Comments Tab ─────────────────────────────────────────────────────────────
export function CommentsTab({ comments, helpers }: { comments: Comment[]; helpers: CardHelpers }) {
  const { darkMode, getPostName, getSentimentIcon, getSentimentColor, selectedTagFilter } = helpers;

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
          No comments found{selectedTagFilter && ` with tag "${selectedTagFilter}"`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment, idx) => {
        if (comment.error) {
          return (
            <div
              key={`error-comment-${idx}`}
              className={cn(
                "rounded-xl border flex items-start gap-3 p-3.5",
                darkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50 border-rose-200"
              )}
            >
              <IndexBadge index={idx + 1} dark={darkMode} />
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5",
                  darkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-100 text-rose-700"
                )}>
                  <AlertCircle className="size-3" />
                  Error
                </span>
                <p className={cn("text-xs leading-relaxed", darkMode ? "text-slate-300" : "text-slate-700")}>
                  {comment.error || "No result returned by Gemini"}
                </p>
              </div>
            </div>
          );
        }

        const SentimentIcon = getSentimentIcon(comment.sentiment);
        const tags = typeof comment.tags === "string" ? comment.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const entities = typeof comment.entities === "string" ? comment.entities.split(',').map(e => e.trim()).filter(Boolean) : [];

        return (
          <div
            key={`${comment.post_id}-${idx}`}
            className={cn(
              "rounded-xl border transition-all relative",
              comment.is_highlight
                ? darkMode
                  ? "bg-amber-500/5 border-amber-500/30 shadow-amber-900/10 shadow-sm"
                  : "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm"
                : darkMode
                  ? "bg-slate-800/40 border-slate-700/60 shadow-sm"
                  : "bg-white border-slate-100 shadow-sm"
            )}
          >
            {comment.is_highlight && (
              <div className="absolute top-2.5 right-2.5">
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                  darkMode
                    ? "bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-300"
                )}>
                  <Star className="size-2.5 fill-current" />
                  Highlight
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3.5">
              <IndexBadge index={idx + 1} dark={darkMode} />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap pr-16">
                  <p className={cn("font-bold text-xs", darkMode ? "text-slate-100" : "text-slate-800")}>
                    {getPostName(comment.post_id)}
                  </p>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize",
                    getSentimentColor(comment.sentiment)
                  )}>
                    <SentimentIcon className="size-3" />
                    {comment.sentiment}
                  </span>
                </div>
                <p className={cn("text-xs leading-relaxed", darkMode ? "text-slate-300" : "text-slate-600")}>
                  {comment.comment_text}
                </p>
                {tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="size-3 text-slate-400" />
                    {tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          selectedTagFilter === tag
                            ? darkMode ? "bg-brand/20 text-brand-light" : "bg-blue-100 text-blue-700"
                            : darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {entities.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <User className="size-3 text-slate-400" />
                    {entities.map((entity, entityIdx) => (
                      <span
                        key={entityIdx}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          darkMode ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-600"
                        )}
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Insights Tab ─────────────────────────────────────────────────────────────
export function InsightsTab({
  postInsights,
  crossPostInsights,
  helpers,
}: {
  postInsights: Insight[];
  crossPostInsights: Insight[];
  helpers: CardHelpers;
}) {
  const { darkMode, getPostName } = helpers;
  return (
    <div className="space-y-5">
      {postInsights.length > 0 && (
        <div>
          <h3 className={cn("text-[10px] font-black uppercase tracking-wider mb-2 px-0.5", darkMode ? "text-slate-400" : "text-slate-400")}>
            Post-Level Insights
          </h3>
          <div className="space-y-2">
            {postInsights.map((insight, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border p-3.5",
                  darkMode ? "bg-slate-800/40 border-slate-700/60 shadow-sm" : "bg-white border-slate-100 shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center size-7 rounded-lg shrink-0",
                    darkMode ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-500"
                  )}>
                    <Lightbulb className="size-3.5" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {insight.post_id && (
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                        darkMode ? "bg-purple-500/15 text-purple-300" : "bg-purple-50 text-purple-600"
                      )}>
                        {getPostName(insight.post_id)}
                      </span>
                    )}
                    <p className={cn("text-xs leading-relaxed", darkMode ? "text-slate-300" : "text-slate-600")}>
                      {insight.insight_text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {crossPostInsights.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-0.5">
            <TrendingUp className={cn("size-3.5", darkMode ? "text-brand-light" : "text-brand")} />
            <h3 className={cn("text-[10px] font-black uppercase tracking-wider", darkMode ? "text-brand-light" : "text-brand")}>
              Cross-Post Insights
            </h3>
          </div>
          <div className="space-y-2">
            {crossPostInsights.map((insight, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border p-3.5",
                  darkMode
                    ? "bg-brand/5 border-brand/25 shadow-sm"
                    : "bg-gradient-to-br from-brand/5 to-white border-brand/20 shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center size-8 rounded-lg shrink-0",
                    darkMode ? "bg-brand/20 text-brand-light" : "bg-brand/10 text-brand"
                  )}>
                    <FileText className="size-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1.5",
                      darkMode ? "bg-brand/20 text-brand-light" : "bg-brand/10 text-brand"
                    )}>
                      Global Insight
                    </span>
                    <p className={cn("text-xs leading-relaxed font-medium", darkMode ? "text-slate-200" : "text-slate-800")}>
                      {insight.insight_text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
