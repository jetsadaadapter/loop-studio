"use client";

import { MessageSquare, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Post, Metric, Segment, CardHelpers } from "./facebook-analyst-visualizer-types";

// ─── Index badge ──────────────────────────────────────────────────────────────
export function IndexBadge({ index, dark }: { index: number; dark: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-center size-6 rounded-full text-[10px] font-black shrink-0",
      dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"
    )}>
      {index}
    </div>
  );
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────
export function PostsTab({ posts, helpers }: { posts: Post[]; helpers: CardHelpers }) {
  const { darkMode, resolvePostUrl } = helpers;
  return (
    <div className="space-y-2">
      {posts.map((post, idx) => (
        <div
          key={post.post_id}
          className={cn(
            "rounded-xl border transition-all hover:-translate-y-0.5",
            darkMode
              ? "bg-slate-800/40 border-slate-700/60 hover:border-slate-600/80 shadow-sm"
              : "bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md"
          )}
        >
          <div className="flex items-start gap-3 p-3.5">
            <IndexBadge index={idx + 1} dark={darkMode} />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn("font-bold text-xs", darkMode ? "text-slate-100" : "text-slate-800")}>
                  {post.page_name}
                </p>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  darkMode ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-600"
                )}>
                  {post.post_type}
                </span>
                <div className="flex items-center gap-1">
                  <MessageSquare className="size-3 text-slate-400" />
                  <span className={cn("text-[10px] font-semibold", darkMode ? "text-slate-400" : "text-slate-500")}>
                    {post.comments_analyzed}
                  </span>
                </div>
              </div>
              <p className={cn("text-xs leading-relaxed line-clamp-2", darkMode ? "text-slate-300" : "text-slate-600")}>
                {post.post_summary}
              </p>
              <a
                href={resolvePostUrl(post, idx)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
                  darkMode
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <ExternalLink className="size-3" />
                <span className="truncate max-w-[200px]">{post.post_url_display || "View Post"}</span>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Metrics Tab ──────────────────────────────────────────────────────────────
export function MetricsTab({ metrics, helpers }: { metrics: Metric[]; helpers: CardHelpers }) {
  const { darkMode, getPostName, getMetricColor, getMetricBg, formatMetricValue, getDisplayPct } = helpers;
  return (
    <div className="space-y-2">
      {metrics.map((metric, idx) => {
        const pct = metric.metric_type === 'percentage' ? getDisplayPct(metric.metric_value) : null;
        return (
          <div
            key={`${metric.post_id}-${metric.metric_key}`}
            className={cn(
              "rounded-xl border transition-all",
              darkMode
                ? "bg-slate-800/40 border-slate-700/60 shadow-sm"
                : "bg-white border-slate-100 shadow-sm"
            )}
          >
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <IndexBadge index={idx + 1} dark={darkMode} />
                <div className="min-w-0">
                  <p className={cn("font-bold text-xs", darkMode ? "text-slate-100" : "text-slate-800")}>
                    {getPostName(metric.post_id)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {metric.metric_key.replace(/_/g, ' ')}
                    </p>
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide",
                      metric.metric_type === 'percentage'
                        ? darkMode ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-600"
                        : darkMode ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-600"
                    )}>
                      {metric.metric_type === 'percentage' ? '% ratio' : metric.metric_type === 'count' ? '# count' : metric.metric_type}
                    </span>
                  </div>
                  {pct !== null && (
                    <div className={cn("mt-1.5 h-1 rounded-full overflow-hidden w-24", darkMode ? "bg-slate-700" : "bg-slate-100")}>
                      <div
                        className={cn("h-full rounded-full transition-all", getMetricColor(metric.metric_value, metric.metric_type).replace('text-', 'bg-'))}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shrink-0",
                getMetricBg(metric.metric_value, metric.metric_type)
              )}>
                <span className={cn("text-lg font-black leading-none", getMetricColor(metric.metric_value, metric.metric_type))}>
                  {formatMetricValue(metric.metric_value, metric.metric_type)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Segments Tab ─────────────────────────────────────────────────────────────
export function SegmentsTab({
  groupedSegments,
  helpers,
}: {
  groupedSegments: Record<string, Segment[]>;
  helpers: CardHelpers;
}) {
  const { darkMode, getPostName, getSentimentIcon, getSentimentColor } = helpers;
  return (
    <TooltipProvider delay={200}>
      <div className="space-y-5">
        {Object.entries(groupedSegments).map(([segmentType, segmentList]) => (
          <div key={segmentType}>
            <h3 className={cn("text-[10px] font-black uppercase tracking-wider mb-2 px-0.5", darkMode ? "text-slate-400" : "text-slate-400")}>
              {segmentType}
            </h3>
            <div className="space-y-2">
              {segmentList.map((segment, idx) => {
                const SentimentIcon = getSentimentIcon(segment.sentiment);
                return (
                  <div
                    key={`${segment.post_id}-${segment.segment_key}`}
                    className={cn(
                      "rounded-xl border transition-all",
                      darkMode ? "bg-slate-800/40 border-slate-700/60 shadow-sm" : "bg-white border-slate-100 shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-2.5">
                        <IndexBadge index={idx + 1} dark={darkMode} />
                        <div>
                          <p className={cn("font-bold text-xs", darkMode ? "text-slate-100" : "text-slate-800")}>{getPostName(segment.post_id)}</p>
                          <p className={cn("text-xs mt-0.5", darkMode ? "text-slate-400" : "text-slate-500")}>{segment.segment_key.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help group">
                            <div className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                              darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            )}>
                              <span>{segment.count} ({segment.percent})</span>
                              <Info className={cn("size-3 transition-transform group-hover:scale-110", darkMode ? "text-slate-400" : "text-slate-400")} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs font-semibold">{segment.segment_key.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-300">{segment.count} items ({segment.percent} of this post&apos;s segments)</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize",
                          getSentimentColor(segment.sentiment)
                        )}>
                          <SentimentIcon className="size-3" />
                          {segment.sentiment}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
