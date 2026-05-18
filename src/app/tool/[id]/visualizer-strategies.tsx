"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Heart,
  Newspaper,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  User,
  ChevronDown
} from "lucide-react";

// -------------------------------------------------------------
// 1. RATIO VISUALIZER (Segmented Stacked Bar for Case 1)
// -------------------------------------------------------------
interface RatioVisualizerProps {
  intentRatios?: {
    buyIntent: number;
    notInterested: number;
    negative: number;
  };
}

export function RatioVisualizer({ intentRatios }: RatioVisualizerProps) {
  if (!intentRatios) return null;

  const { buyIntent = 0, notInterested = 0, negative = 0 } = intentRatios;

  // Normalize ratios to ensure total is exactly 100%
  const total = buyIntent + notInterested + negative;
  const buyPct = total > 0 ? Math.round((buyIntent / total) * 100) : 0;
  const neutralPct = total > 0 ? Math.round((notInterested / total) * 100) : 0;
  const negativePct = total > 0 ? 100 - buyPct - neutralPct : 0; // Prevent floating point mismatch

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wide uppercase">
        <span>Intent Ratio Analysis</span>
        <span className="text-brand font-bold">Total: 100%</span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="h-4 w-full rounded-full flex overflow-hidden bg-slate-100 shadow-inner border border-slate-200/50">
        {buyPct > 0 && (
          <div
            style={{ width: `${buyPct}%` }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
            title={`Buy Intent: ${buyPct}%`}
          />
        )}
        {neutralPct > 0 && (
          <div
            style={{ width: `${neutralPct}%` }}
            className="bg-gradient-to-r from-slate-300 to-slate-400 h-full transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
            title={`Neutral/Uninterested: ${neutralPct}%`}
          />
        )}
        {negativePct > 0 && (
          <div
            style={{ width: `${negativePct}%` }}
            className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
            title={`Negative/Critique: ${negativePct}%`}
          />
        )}
      </div>

      {/* Ratios Labels Deck */}
      <div className="grid grid-cols-3 gap-3">
        {/* Buy Intent */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center justify-center transition-all hover:scale-[1.02] hover:bg-emerald-50">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
            <ShoppingBag className="size-3.5" />
            <span>Buy Intent</span>
          </div>
          <span className="text-xl font-bold text-emerald-800 mt-1">{buyPct}%</span>
        </div>

        {/* Neutral */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex flex-col items-center justify-center transition-all hover:scale-[1.02] hover:bg-slate-100/70">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
            <HelpCircle className="size-3.5" />
            <span>Uninterested</span>
          </div>
          <span className="text-xl font-bold text-slate-700 mt-1">{neutralPct}%</span>
        </div>

        {/* Negative */}
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex flex-col items-center justify-center transition-all hover:scale-[1.02] hover:bg-rose-50">
          <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
            <XCircle className="size-3.5" />
            <span>Negative</span>
          </div>
          <span className="text-xl font-bold text-rose-800 mt-1">{negativePct}%</span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. MULTI-LABEL VISUALIZER (Badges & Tags Grid for Case 2)
// -------------------------------------------------------------
interface MultiLabelVisualizerProps {
  postType?: string;
  commentThemes?: Array<{
    theme: string;
    count: number;
    percentage: number;
  }>;
}

const THEME_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  general: { label: "General Chat", icon: <MessageSquare className="size-3" />, color: "bg-slate-100 text-slate-700 border-slate-200" },
  mention_friend: { label: "Tag Friends", icon: <Users className="size-3" />, color: "bg-blue-50 text-blue-700 border-blue-100" },
  positive_praise: { label: "Product Praise", icon: <CheckCircle2 className="size-3" />, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  negative_critique: { label: "Product Critique", icon: <XCircle className="size-3" />, color: "bg-rose-50 text-rose-700 border-rose-100" },
  jokes_irrelevant: { label: "Memes & Jokes", icon: <HelpCircle className="size-3" />, color: "bg-amber-50 text-amber-700 border-amber-100" },
};

export function MultiLabelVisualizer({ postType, commentThemes }: MultiLabelVisualizerProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Primary Category Badge */}
      {postType && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Classification</span>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm",
            postType.toLowerCase().includes('sales') && "bg-indigo-50 text-indigo-700 border-indigo-100",
            postType.toLowerCase().includes('lifestyle') && "bg-rose-50 text-rose-700 border-rose-100",
            postType.toLowerCase().includes('news') && "bg-emerald-50 text-emerald-700 border-emerald-100"
          )}>
            {postType.toLowerCase().includes('sales') && <ShoppingBag className="size-3.5" />}
            {postType.toLowerCase().includes('lifestyle') && <Heart className="size-3.5" />}
            {postType.toLowerCase().includes('news') && <Newspaper className="size-3.5" />}
            <span>{postType}</span>
          </div>
        </div>
      )}

      {/* Multi-Label Comments Themes */}
      {commentThemes && commentThemes.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Comment Themes (Multi-label)</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {commentThemes.map((item, index) => {
              const themeConfig = THEME_LABELS[item.theme] || {
                label: item.theme,
                icon: <MessageSquare className="size-3" />,
                color: "bg-slate-50 text-slate-600 border-slate-200"
              };

              return (
                <div
                  key={`${item.theme}-${index}`}
                  className={cn("flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-sm", themeConfig.color)}
                >
                  <div className="flex items-center gap-2">
                    {themeConfig.icon}
                    <span className="text-xs font-semibold">{themeConfig.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block">{item.count} comments</span>
                    <span className="text-[10px] opacity-80">{item.percentage}% ratio</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. ACCORDION ENTITY VISUALIZER (Politician Group for Case 3)
// -------------------------------------------------------------
interface AccordionVisualizerProps {
  politicians?: string[];
  comments?: Array<{
    authorName?: string;
    text: string;
    mentions?: string[];
  }>;
}

export function AccordionVisualizer({ politicians, comments }: AccordionVisualizerProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

  if (!politicians || politicians.length === 0) return null;

  return (
    <div className="space-y-3 w-full">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Mentions Grouping Analysis</span>
      <div className="space-y-2">
        {politicians.map((politician, index) => {
          // Filter comments mentioning this politician
          const politicianComments = Array.isArray(comments) ? comments.filter(c =>
            c.mentions?.some(m => m.toLowerCase().includes(politician.toLowerCase()))
          ) : [];

          const isExpanded = expandedIndex === index;

          return (
            <div
              key={`${politician}-${index}`}
              className="border border-slate-100 rounded-xl bg-slate-50/30 overflow-hidden transition-all shadow-sm"
            >
              {/* Trigger header */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full px-4 py-3.5 flex items-center justify-between bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <User className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">{politician}</span>
                    <span className="text-[10px] text-slate-400 block">{politicianComments.length} mentions in comments</span>
                  </div>
                </div>
                <ChevronDown className={cn("size-4 text-slate-400 transition-transform duration-200", isExpanded && "transform rotate-180")} />
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="p-3 bg-slate-50/50 space-y-2 max-h-[220px] overflow-y-auto">
                  {politicianComments.length > 0 ? (
                    politicianComments.map((comment, commentIdx) => (
                      <div
                        key={commentIdx}
                        className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm text-xs text-slate-700"
                      >
                        <span className="font-semibold text-brand text-[10px] block mb-1">
                          👤 {comment.authorName || "Anonymous User"}
                        </span>
                        <p className="line-clamp-2 leading-relaxed">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No matching comment text crawled.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
