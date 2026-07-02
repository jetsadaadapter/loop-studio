export interface DynamicUISection {
  section_id: string;
  section_title: string;
  section_type: "pie_chart" | "bar_chart" | "table" | "list" | "scorecard" | "heatmap";
  what_to_measure?: string;
  signal_keywords?: string;
  priority?: number;
  labels?: Record<string, string>;
  data?: Record<string, unknown>[];
}

export interface DynamicUIItem {
  task_intent: string | Record<string, unknown>;
  task_description: string;
  sections: DynamicUISection[];
  overall_sentiment_focus: string;
  confidence_note: string;
}

export interface DynamicLayoutVisualizerProps {
  items: DynamicUIItem[];
}
