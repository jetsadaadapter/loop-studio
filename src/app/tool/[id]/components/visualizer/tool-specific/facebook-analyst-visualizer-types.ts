import React from "react";

export interface Post {
  post_id: string;
  post_url: string;
  post_url_display: string;
  page_name: string;
  post_summary: string;
  post_type: string;
  comments_analyzed: number;
}

export interface Metric {
  post_id: string;
  metric_key: string;
  metric_value: number;
  metric_type: string;
}

export interface Segment {
  post_id: string;
  segment_type: string;
  segment_key: string;
  count: number;
  percent: string;
  sentiment: string;
}

export interface Comment {
  post_id: string;
  comment_text: string;
  tags: string;
  sentiment: string;
  entities: string;
  is_highlight: boolean;
  error?: string;
}

export interface Insight {
  scope: 'post' | 'cross_post';
  post_id: string | null;
  insight_text: string;
}

export interface SocialAnalystPayload {
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

export interface CardHelpers {
  darkMode: boolean;
  getPostName: (postId: string) => string;
  getSentimentIcon: (sentiment: string) => React.ComponentType<{ className?: string }>;
  getSentimentColor: (sentiment: string) => string;
  getMetricColor: (value: number, metricType: string) => string;
  getMetricBg: (value: number, metricType: string) => string;
  formatMetricValue: (value: number, metricType: string) => string;
  resolvePostUrl: (post: Post, idx: number) => string;
  selectedTagFilter: string;
}
