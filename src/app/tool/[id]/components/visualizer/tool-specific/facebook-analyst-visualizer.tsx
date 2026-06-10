"use client";

import { useState, useMemo } from "react";
import { Moon, Sun, Filter, TrendingUp, MessageSquare, FileText, BarChart3, AlertCircle, Lightbulb, ExternalLink, Star, Tag, User, Smile, Frown, Meh, Clock, Hash, Target, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialAnalystVisualizerProps {
  job: ToolJob;
}

interface Post {
  post_id: string;
  post_url: string;
  post_url_display: string;
  page_name: string;
  post_summary: string;
  post_type: string;
  comments_analyzed: number;
}

interface Metric {
  post_id: string;
  metric_key: string;
  metric_value: number;
  metric_type: string;
}

interface Segment {
  post_id: string;
  segment_type: string;
  segment_key: string;
  count: number;
  percent: string;
  sentiment: string;
}

interface Comment {
  post_id: string;
  comment_text: string;
  tags: string;
  sentiment: string;
  entities: string;
  is_highlight: boolean;
}

interface Insight {
  scope: 'post' | 'cross_post';
  post_id: string | null;
  insight_text: string;
}

interface SocialAnalystPayload {
  task_id: string;
  task_intent: string;
  posts_analyzed: number;
  generated_at: string;
  posts: Post[];
  metrics: Metric[];
  segments: Segment[];
  comments: Comment[];
  insights: Insight[];
}

function extractSocialAnalystData(job: ToolJob): SocialAnalystPayload | null {
  try {
    if (!job.result || typeof job.result !== 'object') return null;

    const result = job.result as Record<string, unknown>;

    // Check if this is a Social Media Analyst result with posts array
    if (!result.posts || !Array.isArray(result.posts)) return null;

    return {
      task_id: (result.task_id as string) || job.id || 'unknown',
      task_intent: (result.task_intent as string) || 'unknown',
      posts_analyzed: (result.posts_analyzed as number) || 0,
      generated_at: (result.generated_at as string) || new Date().toISOString(),
      posts: (result.posts as Post[]) || [],
      metrics: (result.metrics as Metric[]) || [],
      segments: (result.segments as Segment[]) || [],
      comments: (result.comments as Comment[]) || [],
      insights: (result.insights as Insight[]) || []
    };
  } catch (error) {
    console.error('Failed to extract Social Analyst data:', error);
    return null;
  }
}

export function FacebookAnalystVisualizer({ job }: SocialAnalystVisualizerProps) {
  const data = useMemo(() => extractSocialAnalystData(job), [job]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'posts' | 'metrics' | 'segments' | 'comments' | 'insights'>('posts');

  if (!data) {
    return null;
  }

  // Extract all unique tags from comments
  const allTags = Array.from(
    new Set(
      data.comments.flatMap(c =>
        c.tags.split(',').map(t => t.trim()).filter(Boolean)
      )
    )
  ).sort();

  // Filter comments by selected tag
  const filteredComments = selectedTagFilter
    ? data.comments.filter(c =>
        c.tags.split(',').map(t => t.trim()).includes(selectedTagFilter)
      )
    : data.comments;

  const tabs = [
    { id: 'posts' as const, label: 'Posts', icon: FileText, count: data.posts.length },
    { id: 'metrics' as const, label: 'Metrics', icon: TrendingUp, count: data.metrics.length },
    { id: 'segments' as const, label: 'Segments', icon: BarChart3, count: data.segments.length },
    { id: 'comments' as const, label: 'Comments', icon: MessageSquare, count: data.comments.length },
    { id: 'insights' as const, label: 'Insights', icon: AlertCircle, count: data.insights.length }
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentIcon = (sentiment: string) => {
    const normalized = sentiment.toLowerCase();
    if (normalized === 'positive') return Smile;
    if (normalized === 'negative') return Frown;
    return Meh;
  };

  const getSentimentColor = (sentiment: string) => {
    const normalized = sentiment.toLowerCase();
    if (normalized === 'positive') return darkMode ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (normalized === 'negative') return darkMode ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'text-rose-700 bg-rose-50 border-rose-200';
    return darkMode ? 'text-slate-400 bg-slate-500/10 border-slate-500/30' : 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return darkMode ? 'text-emerald-400' : 'text-emerald-600';
    if (value >= 60) return darkMode ? 'text-amber-400' : 'text-amber-600';
    return darkMode ? 'text-rose-400' : 'text-rose-600';
  };

  const getMetricBg = (value: number) => {
    if (value >= 80) return darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200';
    if (value >= 60) return darkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200';
    return darkMode ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200';
  };

  const getPostName = (postId: string) => {
    const post = data.posts.find(p => p.post_id === postId);
    return post?.page_name || 'Unknown';
  };

  // Group segments by segment_type
  const groupedSegments = data.segments.reduce((acc, segment) => {
    if (!acc[segment.segment_type]) {
      acc[segment.segment_type] = [];
    }
    acc[segment.segment_type].push(segment);
    return acc;
  }, {} as Record<string, Segment[]>);

  const postInsights = data.insights.filter(i => i.scope === 'post');
  const crossPostInsights = data.insights.filter(i => i.scope === 'cross_post');

  return (
    <div className={cn(
      "font-sans transition-colors duration-300 overflow-hidden",
      darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
    )}>
      {/* Header */}
      <div className={cn(
        "border-b",
        darkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
      )}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Social Media Analysis</h2>
              <p className={cn(
                "text-xs font-medium mt-0.5",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}>
                Post analysis and insights
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Tag Filter - Show only on Comments tab */}
              {activeTab === 'comments' && allTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="size-3.5 text-slate-400" />
                  <Select
                    value={selectedTagFilter}
                    onValueChange={(value) => setSelectedTagFilter(value || "")}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-[140px] px-3 py-1.5 h-auto rounded-lg text-xs font-semibold border transition-colors",
                        darkMode
                          ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      )}
                      aria-label="Filter by tag"
                    >
                      <SelectValue placeholder="All Tags" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="">All Tags</SelectItem>
                      {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "p-1.5 rounded-lg border transition-colors",
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-amber-400 hover:bg-slate-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className={cn(
              "rounded-md p-2 border",
              darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
            )}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Hash className="size-3 text-blue-500" />
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", darkMode ? "text-slate-400" : "text-slate-500")}>Task ID</span>
              </div>
              <p className={cn("text-xs font-semibold truncate", darkMode ? "text-slate-200" : "text-slate-800")}>
                {data.task_id}
              </p>
            </div>

            <div className={cn(
              "rounded-md p-2 border",
              darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
            )}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Target className="size-3 text-purple-500" />
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", darkMode ? "text-slate-400" : "text-slate-500")}>Intent</span>
              </div>
              <p className={cn("text-xs font-semibold truncate", darkMode ? "text-slate-200" : "text-slate-800")}>
                {data.task_intent.replace(/_/g, ' ')}
              </p>
            </div>

            <div className={cn(
              "rounded-md p-2 border",
              darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
            )}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="size-3 text-emerald-500" />
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", darkMode ? "text-slate-400" : "text-slate-500")}>Time</span>
              </div>
              <p className={cn("text-xs font-semibold truncate", darkMode ? "text-slate-200" : "text-slate-800")}>
                {formatDate(data.generated_at)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0",
                    isActive
                      ? darkMode
                        ? "bg-brand text-white"
                        : "bg-brand text-white"
                      : darkMode
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    isActive
                      ? "bg-white/20 text-white"
                      : darkMode
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-200 text-slate-600"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[800px] overflow-y-auto">
        {/* Posts Table */}
        {activeTab === 'posts' && (
          <div className="space-y-2">
            {data.posts.map((post, idx) => (
              <div
                key={post.post_id}
                className={cn(
                  "rounded-lg p-3 border transition-colors",
                  darkMode
                    ? "bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    "flex items-center justify-center size-6 rounded-md text-[10px] font-black shrink-0",
                    darkMode ? "bg-slate-700/50 text-slate-400" : "bg-slate-200 text-slate-600"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("font-bold text-xs", darkMode ? "text-slate-200" : "text-slate-800")}>
                        {post.page_name}
                      </p>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-bold border",
                        darkMode
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      )}>
                        {post.post_type}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <MessageSquare className="size-3 text-slate-400" />
                        <span className={cn("font-semibold", darkMode ? "text-slate-400" : "text-slate-500")}>
                          {post.comments_analyzed}
                        </span>
                      </div>
                    </div>
                    <p className={cn("text-xs line-clamp-2", darkMode ? "text-slate-300" : "text-slate-700")}>
                      {post.post_summary}
                    </p>
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors",
                        darkMode
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      )}
                    >
                      <ExternalLink className="size-3" />
                      {post.post_url_display || "View Post"}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metrics */}
        {activeTab === 'metrics' && (
          <div className="space-y-2">
            {data.metrics.map((metric, idx) => (
              <div
                key={`${metric.post_id}-${metric.metric_key}`}
                className={cn(
                  "rounded-lg p-3 border",
                  darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "flex items-center justify-center size-6 rounded-md text-[10px] font-black",
                      darkMode ? "bg-slate-700/50 text-slate-400" : "bg-slate-200 text-slate-600"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className={cn("font-bold text-xs", darkMode ? "text-slate-200" : "text-slate-800")}>
                        {getPostName(metric.post_id)}
                      </p>
                      <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
                        {metric.metric_key.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black",
                    getMetricBg(metric.metric_value)
                  )}>
                    <TrendingUp className={cn("size-3.5", getMetricColor(metric.metric_value))} />
                    <span className={cn("text-sm", getMetricColor(metric.metric_value))}>
                      {metric.metric_value}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Segments */}
        {activeTab === 'segments' && (
          <TooltipProvider delay={200}>
            <div className="space-y-4">
              {Object.entries(groupedSegments).map(([segmentType, segmentList]) => (
                <div key={segmentType}>
                  <h3 className={cn(
                    "text-[10px] font-black uppercase tracking-wider mb-2",
                    darkMode ? "text-slate-400" : "text-slate-500"
                  )}>
                    {segmentType}
                  </h3>
                  <div className="space-y-2">
                    {segmentList.map((segment, idx) => {
                      const SentimentIcon = getSentimentIcon(segment.sentiment);
                      return (
                        <div
                          key={`${segment.post_id}-${segment.segment_key}`}
                          className={cn(
                            "rounded-lg p-3 border",
                            darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "flex items-center justify-center size-6 rounded-md text-[10px] font-black",
                                darkMode ? "bg-slate-700/50 text-slate-400" : "bg-slate-200 text-slate-600"
                              )}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className={cn("font-bold text-xs", darkMode ? "text-slate-200" : "text-slate-800")}>
                                  {getPostName(segment.post_id)}
                                </p>
                                <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
                                  {segment.segment_key.replace(/_/g, ' ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help group">
                                  <div className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all border-2 border-dashed",
                                    darkMode
                                      ? "bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600 hover:border-slate-500"
                                      : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 hover:border-slate-400"
                                  )}>
                                    <span>{segment.count} ({segment.percent})</span>
                                    <Info className={cn(
                                      "size-3 transition-transform group-hover:scale-110",
                                      darkMode ? "text-slate-400" : "text-slate-500"
                                    )} />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs font-semibold">{segment.segment_key.replace(/_/g, ' ')}</p>
                                  <p className="text-xs text-slate-300">
                                    {segment.count} items ({segment.percent} of this post&apos;s segments)
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs border capitalize",
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
        )}

        {/* Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-2">
            {filteredComments.map((comment, idx) => {
              const SentimentIcon = getSentimentIcon(comment.sentiment);
              const tags = comment.tags.split(',').map(t => t.trim()).filter(Boolean);
              const entities = comment.entities.split(',').map(e => e.trim()).filter(Boolean);

              return (
                <div
                  key={`${comment.post_id}-${idx}`}
                  className={cn(
                    "rounded-lg p-3 border transition-colors relative",
                    comment.is_highlight && (
                      darkMode
                        ? "bg-amber-500/5 border-amber-500/30"
                        : "bg-amber-50 border-amber-300"
                    ),
                    !comment.is_highlight && (
                      darkMode
                        ? "bg-slate-800/30 border-slate-700/50"
                        : "bg-slate-50 border-slate-200"
                    )
                  )}
                >
                  {comment.is_highlight && (
                    <div className="absolute top-2 right-2">
                      <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border",
                        darkMode
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-amber-100 border-amber-300 text-amber-700"
                      )}>
                        <Star className="size-2.5 fill-current" />
                        Highlight
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      "flex items-center justify-center size-6 rounded-md text-[10px] font-black shrink-0",
                      darkMode ? "bg-slate-700/50 text-slate-400" : "bg-slate-200 text-slate-600"
                    )}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-bold text-xs", darkMode ? "text-slate-200" : "text-slate-800")}>
                          {getPostName(comment.post_id)}
                        </p>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-xs border capitalize",
                          getSentimentColor(comment.sentiment)
                        )}>
                          <SentimentIcon className="size-3" />
                          {comment.sentiment}
                        </span>
                      </div>

                      <p className={cn("text-xs leading-relaxed", darkMode ? "text-slate-300" : "text-slate-700")}>
                        {comment.comment_text}
                      </p>

                      {tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="size-3 text-slate-400" />
                          {tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                                selectedTagFilter === tag
                                  ? darkMode
                                    ? "bg-brand/20 border-brand/40 text-brand-light"
                                    : "bg-blue-50 border-blue-200 text-blue-700"
                                  : darkMode
                                    ? "bg-slate-700/50 border-slate-600 text-slate-300"
                                    : "bg-slate-100 border-slate-200 text-slate-600"
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {entities.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="size-3 text-slate-400" />
                          {entities.map((entity, entityIdx) => (
                            <span
                              key={entityIdx}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                                darkMode
                                  ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                  : "bg-violet-50 border-violet-200 text-violet-700"
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
            {filteredComments.length === 0 && (
              <div className="text-center py-12">
                <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
                  No comments found {selectedTagFilter && `with tag "${selectedTagFilter}"`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Insights */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {postInsights.length > 0 && (
              <div>
                <h3 className={cn(
                  "text-[10px] font-black uppercase tracking-wider mb-2",
                  darkMode ? "text-slate-400" : "text-slate-500"
                )}>
                  Post-Level Insights
                </h3>
                <div className="space-y-2">
                  {postInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-lg p-3 border",
                        darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn(
                          "flex items-center justify-center size-7 rounded-md shrink-0",
                          darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                        )}>
                          <Lightbulb className="size-4" />
                        </div>
                        <div className="flex-1 space-y-2">
                          {insight.post_id && (
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border",
                              darkMode
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                : "bg-purple-50 border-purple-200 text-purple-700"
                            )}>
                              {getPostName(insight.post_id)}
                            </span>
                          )}
                          <p className={cn("text-xs leading-relaxed", darkMode ? "text-slate-300" : "text-slate-700")}>
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
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className={cn("size-3.5", darkMode ? "text-brand-light" : "text-brand")} />
                  <h3 className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    darkMode ? "text-brand-light" : "text-brand"
                  )}>
                    Cross-Post Insights
                  </h3>
                </div>
                <div className="space-y-2">
                  {crossPostInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-lg p-3 border",
                        darkMode
                          ? "bg-slate-800/30 border-brand/30"
                          : "bg-gradient-to-br from-brand/5 to-white border-brand/20"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn(
                          "flex items-center justify-center size-8 rounded-md shrink-0",
                          darkMode ? "bg-brand/20 text-brand-light" : "bg-brand/10 text-brand"
                        )}>
                          <TrendingUp className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1.5">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              darkMode
                                ? "bg-brand/20 border-brand/40 text-brand-light"
                                : "bg-brand/10 border-brand/30 text-brand"
                            )}>
                              Global Insight
                            </span>
                          </div>
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
        )}
      </div>
    </div>
  );
}
