"use client";

import {
  PieChart as PieIcon,
  BarChart3,
  Table2,
  ListOrdered,
  Layers,
  Grid,
  Search,
  Tag,
  Code2,
} from "lucide-react";
import { DynamicUISection } from "./types";
import { PieChartRenderer } from "./renderers/pie-chart-renderer";
import { BarChartRenderer } from "./renderers/bar-chart-renderer";
import { TableRenderer } from "./renderers/table-renderer";
import { ListRenderer } from "./renderers/list-renderer";
import { ScorecardRenderer } from "./renderers/scorecard-renderer";
import { HeatmapRenderer } from "./renderers/heatmap-renderer";

export function SectionWrapper({ section }: { section: DynamicUISection }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "pie_chart":
        return <PieIcon className="size-4 text-brand" />;
      case "bar_chart":
        return <BarChart3 className="size-4 text-brand" />;
      case "table":
        return <Table2 className="size-4 text-brand" />;
      case "list":
        return <ListOrdered className="size-4 text-brand" />;
      case "scorecard":
        return <Layers className="size-4 text-brand" />;
      case "heatmap":
        return <Grid className="size-4 text-brand" />;
      default:
        return <Search className="size-4 text-brand" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "pie_chart":
        return "Pie/Donut Distribution Chart";
      case "bar_chart":
        return "Horizontal Bar Chart";
      case "table":
        return "Data Table Grid";
      case "list":
        return "Ranked Feed List";
      case "scorecard":
        return "Large KPI Scorecards";
      case "heatmap":
        return "Color Grid Matrix Heatmap";
      default:
        return "General Visualization";
    }
  };

  const rawSection = section as unknown as Record<string, unknown>;
  const hasData = Boolean(
    rawSection.data ||
    rawSection.items ||
    rawSection.results ||
    rawSection.values
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-3.5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            {getIcon(section.section_type)}
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">
              {section.section_title}
            </h4>
            {section.priority !== undefined && (
              <span className="text-[9px] font-bold text-slate-400 select-none">
                P{section.priority}
              </span>
            )}
          </div>
          {section.what_to_measure && (
            <p className="text-xs text-slate-455 font-medium leading-relaxed">
              วัตถุประสงค์การวัด: {section.what_to_measure}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-400 select-none">
          <Code2 className="size-3 text-slate-400" />
          <span>{getTypeName(section.section_type)}</span>
        </div>
      </div>

      {/* Keywords Tags */}
      {section.signal_keywords && (
        <div className="flex flex-wrap items-center gap-1 select-none">
          <Tag className="size-3 text-slate-350 shrink-0 mr-0.5" />
          <span className="text-[9px] font-bold text-slate-450 mr-1">ตรวจคัดกรองสัญญาณ:</span>
          {section.signal_keywords.split(",").map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 border border-slate-100"
            >
              {kw.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Section Content Area */}
      {hasData && (
        <div className="pt-1">
          <SectionRenderer section={section} />
        </div>
      )}
    </div>
  );
}

function SectionRenderer({ section }: { section: DynamicUISection }) {
  switch (section.section_type) {
    case "pie_chart":
      return <PieChartRenderer section={section} />;
    case "bar_chart":
      return <BarChartRenderer section={section} />;
    case "table":
      return <TableRenderer section={section} />;
    case "list":
      return <ListRenderer section={section} />;
    case "scorecard":
      return <ScorecardRenderer section={section} />;
    case "heatmap":
      return <HeatmapRenderer section={section} />;
    default:
      return null;
  }
}
