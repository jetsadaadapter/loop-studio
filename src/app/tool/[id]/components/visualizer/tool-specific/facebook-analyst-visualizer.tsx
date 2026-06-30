"use client";

import { useState, useMemo } from "react";
import { Moon, Sun, Filter, TrendingUp, MessageSquare, FileText, BarChart3, AlertCircle, Smile, Frown, Meh, Clock, Hash, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeStartUrls } from "../../../start-urls-utils";
import {
  PostsTab,
  MetricsTab,
  SegmentsTab,
} from "./facebook-analyst-visualizer-cards";
import {
  CommentsTab,
  InsightsTab,
} from "./facebook-analyst-visualizer-extras";
import type {
  Post,
  Metric,
  Segment,
  Comment,
  Insight,
  SocialAnalystPayload,
} from "./facebook-analyst-visualizer-types";

interface SocialAnalystVisualizerProps {
  job: ToolJob;
}

function extractSocialAnalystData(job: ToolJob): SocialAnalystPayload | null {
  try {
    let result = job.result;
    if (Array.isArray(job.result) && job.result.length === 1 && job.result[0] !== null && typeof job.result[0] === 'object') {
      result = job.result[0];
    }
    if (!result || typeof result !== 'object') return null;
    const record = result as Record<string, unknown>;
    if (!record.posts || !Array.isArray(record.posts)) return null;
    return {
      task_id: (record.task_id as string) || job.jobId || job.id || job._id || 'unknown',
      task_intent: (record.task_intent as string) || 'unknown',
      posts_analyzed: (record.posts_analyzed as number) || 0,
      generated_at: (record.generated_at as string) || new Date().toISOString(),
      posts: (record.posts as Post[]) || [],
      metrics: (record.metrics as Metric[]) || [],
      segments: (record.segments as Segment[]) || [],
      comments: (record.comments as Comment[]) || [],
      insights: (record.insights as Insight[]) || []
    };
  } catch (error) {
    console.error('Failed to extract Social Analyst data:', error);
    return null;
  }
}

export function FacebookAnalystVisualizer({ job }: SocialAnalystVisualizerProps) {
  const data = useMemo(() => extractSocialAnalystData(job), [job]);
  const startUrls = useMemo(() => normalizeStartUrls(job.input?.startUrls), [job.input?.startUrls]);

  const [darkMode, setDarkMode] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'posts' | 'metrics' | 'segments' | 'comments' | 'insights'>('posts');

  const resolvePostUrl = (post: Post, idx: number) => {
    const postUrl = String(post.post_url || "").trim();
    const postId = String(post.post_id || "").trim();
    const pageName = String(post.page_name || "").trim().toLowerCase();
    if (postUrl.startsWith("http://") || postUrl.startsWith("https://")) {
      const normalizedPostUrl = postUrl.replace(/\/$/, "");
      const exactMatch = startUrls.find(u => u.replace(/\/$/, "") === normalizedPostUrl);
      if (exactMatch) return exactMatch;
    }
    const extractNumericIds = (val: string): string[] => { const m = val.match(/\d{8,}/g); return m ? Array.from(m) : []; };
    const numericIds = [...extractNumericIds(postUrl), ...extractNumericIds(postId)];
    if (numericIds.length > 0) {
      for (const numId of numericIds) { const m = startUrls.find(u => u.includes(numId)); if (m) return m; }
    }
    if (pageName) {
      const cleanPageName = pageName.replace(/[^a-z0-9]/g, "");
      if (cleanPageName.length >= 3) {
        const m = startUrls.find(u => u.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanPageName));
        if (m) return m;
      }
    }
    const extractPPatternIndex = (val: string): number | null => {
      const lc = val.toLowerCase();
      if (lc.startsWith("p") && /^\d+$/.test(lc.slice(1))) return parseInt(lc.slice(1), 10) - 1;
      try { const p = new URL(val); const segs = p.pathname.split("/").filter(Boolean); const last = segs[segs.length - 1] || ""; if (last.toLowerCase().startsWith("p") && /^\d+$/.test(last.slice(1))) return parseInt(last.slice(1), 10) - 1; } catch {}
      return null;
    };
    const pIndices = [extractPPatternIndex(postId), extractPPatternIndex(postUrl)].filter((v): v is number => v !== null);
    if (pIndices.length > 0) { const index = pIndices[0]; if (index >= 0 && index < startUrls.length) return startUrls[index]; }
    if (idx >= 0 && idx < startUrls.length) return startUrls[idx];
    if (postUrl.startsWith("http://") || postUrl.startsWith("https://")) return postUrl;
    return startUrls[0] || postUrl || "";
  };

  if (!data) return null;

  const allTags = Array.from(new Set(data.comments.flatMap(c => c.tags.split(',').map(t => t.trim()).filter(Boolean)))).sort();
  const filteredComments = selectedTagFilter ? data.comments.filter(c => c.tags.split(',').map(t => t.trim()).includes(selectedTagFilter)) : data.comments;
  const groupedSegments = data.segments.reduce((acc, segment) => { if (!acc[segment.segment_type]) acc[segment.segment_type] = []; acc[segment.segment_type].push(segment); return acc; }, {} as Record<string, Segment[]>);
  const postInsights = data.insights.filter(i => i.scope === 'post');
  const crossPostInsights = data.insights.filter(i => i.scope === 'cross_post');

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getSentimentIcon = (sentiment: string) => { const n = sentiment.toLowerCase(); if (n === 'positive') return Smile; if (n === 'negative') return Frown; return Meh; };
  const getSentimentColor = (sentiment: string) => { const n = sentiment.toLowerCase(); if (n === 'positive') return darkMode ? 'text-emerald-300 bg-emerald-500/15' : 'text-emerald-700 bg-emerald-50'; if (n === 'negative') return darkMode ? 'text-rose-300 bg-rose-500/15' : 'text-rose-700 bg-rose-50'; return darkMode ? 'text-slate-300 bg-slate-700/50' : 'text-slate-600 bg-slate-100'; };
  const getDisplayPct = (value: number) => {
    if (value > 1 || value < -1 || value === 0) return value;
    return value * 100;
  };

  const getMetricColor = (value: number, metricType: string) => { 
    if (metricType === 'count') return darkMode ? 'text-blue-300' : 'text-blue-600'; 
    const pct = metricType === 'percentage' ? getDisplayPct(value) : value; 
    if (pct >= 70) return darkMode ? 'text-emerald-300' : 'text-emerald-600'; 
    if (pct >= 40) return darkMode ? 'text-amber-300' : 'text-amber-600'; 
    return darkMode ? 'text-rose-300' : 'text-rose-600'; 
  };
  
  const getMetricBg = (value: number, metricType: string) => { 
    if (metricType === 'count') return darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'; 
    const pct = metricType === 'percentage' ? getDisplayPct(value) : value; 
    if (pct >= 70) return darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'; 
    if (pct >= 40) return darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'; 
    return darkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'; 
  };
  
  const formatMetricValue = (value: number, metricType: string) => { 
    if (metricType === 'percentage') {
      const pct = getDisplayPct(value);
      return `${Number.isInteger(pct) ? pct : Number(pct).toFixed(1)}%`;
    }
    if (Number.isInteger(value)) return String(value); 
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 }); 
  };

  const getPostName = (postId: string) => data.posts.find(p => p.post_id === postId)?.page_name || 'Unknown';

  const helpers = { darkMode, getPostName, getSentimentIcon, getSentimentColor, getDisplayPct, getMetricColor, getMetricBg, formatMetricValue, resolvePostUrl, selectedTagFilter };

  const tabs = [
    { id: 'posts' as const, label: 'Posts', icon: FileText, count: data.posts.length },
    { id: 'metrics' as const, label: 'Metrics', icon: TrendingUp, count: data.metrics.length },
    { id: 'segments' as const, label: 'Segments', icon: BarChart3, count: data.segments.length },
    { id: 'comments' as const, label: 'Comments', icon: MessageSquare, count: data.comments.length },
    { id: 'insights' as const, label: 'Insights', icon: AlertCircle, count: data.insights.length },
  ];

  const metaCards = [
    { icon: Hash, color: 'text-blue-500', label: 'Task ID', value: data.task_id, gradient: darkMode ? 'from-blue-500/8 to-transparent' : 'from-blue-50/80 to-white' },
    { icon: Target, color: 'text-violet-500', label: 'Intent', value: data.task_intent.replace(/_/g, ' '), gradient: darkMode ? 'from-violet-500/8 to-transparent' : 'from-violet-50/80 to-white' },
    { icon: Clock, color: 'text-emerald-500', label: 'Time', value: formatDate(data.generated_at), gradient: darkMode ? 'from-emerald-500/8 to-transparent' : 'from-emerald-50/80 to-white' },
  ];

  return (
    <div className={cn("font-sans transition-colors duration-300 overflow-hidden", darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50/50 text-slate-900")}>

      {/* Header */}
      <div className={cn("border-b", darkMode ? "bg-slate-900 border-slate-700/80" : "bg-white border-slate-100")}>
        <div className="px-5 pt-4 pb-3">

          {/* Title row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className={cn("text-sm font-black tracking-tight", darkMode ? "text-white" : "text-slate-900")}>Social Media Analysis</h2>
              <p className={cn("text-xs mt-0.5", darkMode ? "text-slate-400" : "text-slate-500")}>Post analysis and insights</p>
            </div>
            <div className="flex items-center gap-2.5">
              {activeTab === 'comments' && allTags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Filter className="size-3 text-slate-400" />
                  <Select value={selectedTagFilter} onValueChange={(value) => setSelectedTagFilter(value || "")}>
                    <SelectTrigger className={cn("w-fit min-w-[160px] px-3 py-1.5 h-auto rounded-lg text-xs font-semibold border transition-colors", darkMode ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white")} aria-label="Filter by tag">
                      <SelectValue placeholder="All Tags" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="text-xs !w-auto min-w-[160px] max-w-[300px]">
                      <SelectItem value="">All Tags</SelectItem>
                      {allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn("p-1.5 rounded-lg border transition-all hover:scale-105", darkMode ? "bg-slate-800 border-slate-600 text-amber-400 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white")}
              >
                {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Meta info cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {metaCards.map(({ icon: Icon, color, label, value, gradient }) => (
              <div key={label} className={cn("rounded-xl p-2.5 border bg-gradient-to-br", gradient, darkMode ? "border-slate-700/60" : "border-slate-100")}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={cn("size-3", color)} />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", darkMode ? "text-slate-500" : "text-slate-400")}>{label}</span>
                </div>
                <p className={cn("text-xs font-bold truncate leading-tight", darkMode ? "text-slate-100" : "text-slate-800")}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tab bar — pill/segment style */}
          <div className={cn("flex items-center gap-1 overflow-x-auto rounded-xl p-1 mb-0", darkMode ? "bg-slate-800/60" : "bg-slate-100/80")}>
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
                      ? darkMode ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                      : darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                    isActive
                      ? darkMode ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                      : darkMode ? "bg-slate-700 text-slate-400" : "bg-white/70 text-slate-400"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 max-h-[800px] overflow-y-auto">
        {activeTab === 'posts' && <PostsTab posts={data.posts} helpers={helpers} />}
        {activeTab === 'metrics' && <MetricsTab metrics={data.metrics} helpers={helpers} />}
        {activeTab === 'segments' && <SegmentsTab groupedSegments={groupedSegments} helpers={helpers} />}
        {activeTab === 'comments' && <CommentsTab comments={filteredComments} helpers={helpers} />}
        {activeTab === 'insights' && <InsightsTab postInsights={postInsights} crossPostInsights={crossPostInsights} helpers={helpers} />}
      </div>
    </div>
  );
}
