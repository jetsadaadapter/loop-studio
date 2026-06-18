import type { ToolJob } from "@/core/interfaces/tools.interface";
import type { DynamicUIItem, DynamicUISection } from "@/components/dynamic-layout-visualizer/types";

export interface FunctionProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: {
    type: string;
    [key: string]: unknown;
  };
  properties?: Record<string, FunctionProperty>;
  required?: string[];
}

export interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters?: {
    type: string;
    properties?: Record<string, FunctionProperty>;
    required?: string[];
  };
}

/**
 * Traverses the job and its inputs/configs to find any function calling schemas.
 */
export function getFunctionDeclarationsFromJob(job: ToolJob): FunctionDeclaration[] {
  const candidates: Record<string, unknown>[] = [];
  
  if (job.input?._preProcessConfig && typeof job.input._preProcessConfig === "object") {
    candidates.push(job.input._preProcessConfig as Record<string, unknown>);
  }
  if ((job.result as Record<string, unknown> | undefined)?.config && typeof (job.result as Record<string, unknown>).config === "object") {
    candidates.push((job.result as Record<string, unknown>).config as Record<string, unknown>);
  }
  if (job.config && typeof job.config === "object") {
    candidates.push(job.config);
  }
  if (job.input?.tools && typeof job.input.tools === "object") {
    candidates.push({ tools: job.input.tools });
  }
  if (job.input?.function_declarations && typeof job.input.function_declarations === "object") {
    candidates.push({ function_declarations: job.input.function_declarations });
  }

  const declarations: FunctionDeclaration[] = [];
  const seenNames = new Set<string>();

  const processCandidate = (obj: Record<string, unknown>) => {
    if (!obj || typeof obj !== "object") return;

    // 1. Direct function_declarations array
    if (Array.isArray(obj.function_declarations)) {
      for (const d of obj.function_declarations) {
        if (d && typeof d === "object" && typeof d.name === "string" && !seenNames.has(d.name)) {
          declarations.push(d as FunctionDeclaration);
          seenNames.add(d.name);
        }
      }
    }

    // 2. Tools array (Gemini format: tools = [{ function_declarations: [...] }])
    if (Array.isArray(obj.tools)) {
      for (const t of obj.tools) {
        if (!t || typeof t !== "object") continue;
        const toolObj = t as Record<string, unknown>;
        if (Array.isArray(toolObj.function_declarations)) {
          for (const d of toolObj.function_declarations) {
            if (d && typeof d === "object" && typeof d.name === "string" && !seenNames.has(d.name)) {
              declarations.push(d as FunctionDeclaration);
              seenNames.add(d.name);
            }
          }
        } else if (toolObj.functionDeclaration && typeof toolObj.functionDeclaration === "object") {
          const d = toolObj.functionDeclaration as Record<string, unknown>;
          if (typeof d.name === "string" && !seenNames.has(d.name)) {
            declarations.push(d as unknown as FunctionDeclaration);
            seenNames.add(d.name);
          }
        } else if (toolObj.name && toolObj.parameters && typeof toolObj.parameters === "object") {
          if (!seenNames.has(toolObj.name as string)) {
            declarations.push(toolObj as unknown as FunctionDeclaration);
            seenNames.add(toolObj.name as string);
          }
        }
      }
    } else if (obj.tools && typeof obj.tools === "object") {
      // 3. Tools object (Gemini format: tools = { function_declarations: [...] })
      const toolObj = obj.tools as Record<string, unknown>;
      if (Array.isArray(toolObj.function_declarations)) {
        for (const d of toolObj.function_declarations) {
          if (d && typeof d === "object" && typeof d.name === "string" && !seenNames.has(d.name)) {
            declarations.push(d as FunctionDeclaration);
            seenNames.add(d.name);
          }
        }
      } else if (toolObj.functionDeclaration && typeof toolObj.functionDeclaration === "object") {
        const d = toolObj.functionDeclaration as Record<string, unknown>;
        if (typeof d.name === "string" && !seenNames.has(d.name)) {
          declarations.push(d as unknown as FunctionDeclaration);
          seenNames.add(d.name);
        }
      } else if (toolObj.name && toolObj.parameters && typeof toolObj.parameters === "object") {
        if (!seenNames.has(toolObj.name as string)) {
          declarations.push(toolObj as unknown as FunctionDeclaration);
          seenNames.add(toolObj.name as string);
        }
      }
    }
  };

  for (const cand of candidates) {
    processCandidate(cand);
  }

  return declarations;
}

/**
 * Safely resolves a property value from a job item by trying nested namespaces or direct keys.
 */
export function getPropertyValue(
  item: Record<string, unknown> | undefined | null,
  propName: string,
  functionName: string
): unknown {
  if (!item) return undefined;

  // Try nested in analysis object
  if (item.analysis && typeof item.analysis === "object") {
    const analysisObj = item.analysis as Record<string, unknown>;
    // Namespace check: item.analysis.functionName.propName
    if (
      analysisObj[functionName] &&
      typeof analysisObj[functionName] === "object" &&
      (analysisObj[functionName] as Record<string, unknown>)[propName] !== undefined
    ) {
      return (analysisObj[functionName] as Record<string, unknown>)[propName];
    }
    // Direct key in analysis: item.analysis.propName
    if (analysisObj[propName] !== undefined) {
      return analysisObj[propName];
    }
  }

  // Try nested on top level: item.functionName.propName
  if (
    item[functionName] &&
    typeof item[functionName] === "object" &&
    (item[functionName] as Record<string, unknown>)[propName] !== undefined
  ) {
    return (item[functionName] as Record<string, unknown>)[propName];
  }

  // Direct key on top level: item.propName
  if (item[propName] !== undefined) {
    return item[propName];
  }

  return undefined;
}

/**
 * Dynamically maps a tool's schemas and item results into matching dynamic UI graphs & tables.
 */
export function generateDynamicLayoutFromSchema(
  job: ToolJob,
  items: Record<string, unknown>[]
): DynamicUIItem[] {
  const resultObj = job.result as Record<string, unknown> | undefined;
  const isStructuredReport = Boolean(
    resultObj &&
    typeof resultObj === "object" &&
    !Array.isArray(resultObj) &&
    "section_meta" in resultObj &&
    Array.isArray(resultObj.section_meta) &&
    "section_rows" in resultObj &&
    Array.isArray(resultObj.section_rows)
  );

  if (isStructuredReport) {
    const meta = (resultObj!.meta || {}) as Record<string, unknown>;
    const summary = (resultObj!.summary || {}) as Record<string, unknown>;
    const sectionMeta = (resultObj!.section_meta || []) as Record<string, unknown>[];
    const sectionRows = (resultObj!.section_rows || []) as Record<string, unknown>[];
    const highlights = (resultObj!.highlights || []) as Record<string, unknown>[];
    const insights = (resultObj!.insights || []) as Record<string, unknown>[];

    const sections: DynamicUISection[] = [];
    let priorityCounter = 1;

    for (const sMeta of sectionMeta) {
      const sectionId = String(sMeta.section_id || "");
      const sectionTitle = String(sMeta.section_title || "");
      const sectionType = String(sMeta.section_type || "").toLowerCase() as DynamicUISection["section_type"];
      const whatToMeasure = String(sMeta.section_note || sMeta.what_to_measure || "");

      const matchedRows = sectionRows.filter((r) => String(r.section_id) === sectionId);

      let data: Record<string, unknown>[] = [];
      if (sectionType === "pie_chart" || sectionType === "bar_chart") {
        data = matchedRows.map((r) => {
          const isValueNumeric = r.value !== undefined && r.value !== null && !Number.isNaN(Number(r.value)) && typeof r.value !== "boolean";
          
          let resolvedLabel = "";
          if (!isValueNumeric && typeof r.value === "string" && r.value.trim() !== "") {
            resolvedLabel = r.value;
          } else {
            resolvedLabel = String(r.label || r.row_id || "");
          }

          let resolvedVal = 0;
          if (typeof r.total_comments === "number") {
            resolvedVal = r.total_comments;
          } else if (typeof r.comment_count === "number") {
            resolvedVal = r.comment_count;
          } else if (isValueNumeric) {
            resolvedVal = Number(r.value);
          } else if (typeof r.total_comments === "string") {
            resolvedVal = parseFloat(r.total_comments) || 0;
          } else if (typeof r.comment_count === "string") {
            resolvedVal = parseFloat(r.comment_count) || 0;
          } else if (r.overall_percent && typeof r.overall_percent === "string") {
            resolvedVal = parseFloat(r.overall_percent) || 0;
          } else if (r.percent && typeof r.percent === "string") {
            resolvedVal = parseFloat(r.percent) || 0;
          }

          return {
            label: resolvedLabel,
            value: resolvedVal,
          };
        });
      } else if (sectionType === "list") {
        if (matchedRows.length > 0) {
          data = matchedRows.map((r) => ({
            comment: String(r.comment_text || r.comment || r.label || r.value || ""),
            keywords_mentioned: typeof r.tags === "string" 
              ? r.tags.split(",").map((t) => t.trim()) 
              : Array.isArray(r.tags) ? r.tags : []
          }));
        } else {
          const titleLower = sectionTitle.toLowerCase();
          const idLower = sectionId.toLowerCase();
          
          const isInsightsList = idLower.includes("insight") || titleLower.includes("insight") || titleLower.includes("ข้อเสนอแนะ") || titleLower.includes("วิเคราะห์");
          const isHighlightsList = idLower.includes("highlight") || titleLower.includes("highlight") || titleLower.includes("comment") || titleLower.includes("ความคิดเห็น") || titleLower.includes("เด่น");

          if (isInsightsList && insights.length > 0) {
            data = insights.map((insight) => ({
              comment: String(insight.insight_text || insight.text || insight),
            }));
          } else if (isHighlightsList && highlights.length > 0) {
            data = highlights.map((h) => ({
              comment: String(h.comment_text || "") + (h.reason ? ` — ${h.reason}` : ""),
              keywords_mentioned: typeof h.tags === "string" 
                ? h.tags.split(",").map((t) => t.trim()) 
                : Array.isArray(h.tags) ? h.tags : [],
            }));
          } else {
            if (highlights.length > 0) {
              data = highlights.map((h) => ({
                comment: String(h.comment_text || "") + (h.reason ? ` — ${h.reason}` : ""),
                keywords_mentioned: typeof h.tags === "string" 
                  ? h.tags.split(",").map((t) => t.trim()) 
                  : Array.isArray(h.tags) ? h.tags : [],
              }));
            } else if (insights.length > 0) {
              data = insights.map((insight) => ({
                comment: String(insight.insight_text || insight.text || insight),
              }));
            }
          }
        }
      } else {
        data = matchedRows;
      }

      sections.push({
        section_id: sectionId,
        section_title: sectionTitle,
        section_type: sectionType,
        what_to_measure: whatToMeasure,
        data,
        priority: priorityCounter++,
      });
    }

    const hasListSection = sections.some((s) => s.section_type === "list" && s.data && s.data.length > 0);
    if (!hasListSection && highlights.length > 0) {
      sections.push({
        section_id: "highlights_list",
        section_title: "ข้อความคอมเมนต์ที่น่าสนใจ (Highlighted Comments)",
        section_type: "list",
        what_to_measure: "ความคิดเห็นเด่นที่มีน้ำเสียงเจตนาชัดเจน",
        data: highlights.map((h) => ({
          comment: String(h.comment_text || "") + (h.reason ? ` — ${h.reason}` : ""),
          keywords_mentioned: typeof h.tags === "string" 
            ? h.tags.split(",").map((t) => t.trim()) 
            : Array.isArray(h.tags) ? h.tags : [],
        })),
        priority: priorityCounter++,
      });
    }

    if (insights.length > 0) {
      sections.push({
        section_id: "insights_list",
        section_title: "ข้อมูลเชิงลึกและข้อเสนอแนะ (Insights & Recommendations)",
        section_type: "list",
        what_to_measure: "สรุปข้อมูลเชิงลึกจากการวิเคราะห์",
        data: insights.map((insight) => ({
          comment: String(insight.insight_text || insight.text || insight),
        })),
        priority: priorityCounter++,
      });
    }

    const taskIntent = String(meta.task_intent || "analyze_purchase_intent");
    const taskDescription = String(summary.one_line || "สแกนและวิเคราะห์ความคิดเห็นตามโครงสร้างรายงาน");
    const overallSentiment = String(summary.overall_sentiment || "mixed");
    
    const rawScore = typeof summary.confidence_score === "number"
      ? summary.confidence_score
      : parseFloat(String(summary.confidence_score));
      
    let confidencePercent = 100;
    if (!Number.isNaN(rawScore) && rawScore !== null && rawScore !== undefined) {
      confidencePercent = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
    }

    return [
      {
        task_intent: taskIntent,
        task_description: taskDescription,
        sections,
        overall_sentiment_focus: overallSentiment,
        confidence_note: `ระดับความมั่นใจ (Confidence Score): ${confidencePercent}% | คุณภาพข้อมูล: ${meta.data_quality || "good"}`,
      },
    ];
  }

  const declarations = getFunctionDeclarationsFromJob(job);
  if (declarations.length === 0) return [];

  return declarations.map((decl) => {
    const functionName = decl.name;
    const functionDescription = decl.description || `วิเคราะห์ข้อมูลด้วยฟังก์ชัน ${functionName}`;
    const properties = decl.parameters?.properties || {};
    const sections: DynamicUISection[] = [];
    let priorityCounter = 1;

    // Process each property to construct sections
    for (const [propName, propVal] of Object.entries(properties)) {
      const prop = propVal as FunctionProperty;
      const propType = String(prop.type || "").toUpperCase();
      const propDescription = prop.description || propName;

      // Extract values for this property across all items
      const rawValues = items
        .map((item) => getPropertyValue(item, propName, functionName))
        .filter((v) => v !== undefined && v !== null);

      if (propType === "ARRAY" || (rawValues.length > 0 && Array.isArray(rawValues[0]))) {
        // Flatten arrays
        const flatValues: string[] = [];
        for (const val of rawValues) {
          if (Array.isArray(val)) {
            flatValues.push(...val.map((v) => String(v).trim()));
          } else {
            flatValues.push(String(val).trim());
          }
        }

        if (flatValues.length > 0) {
          const freqMap: Record<string, number> = {};
          for (const v of flatValues) {
            freqMap[v] = (freqMap[v] || 0) + 1;
          }

          const chartData = Object.entries(freqMap)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);

          sections.push({
            section_id: `${functionName}_${propName}_bar`,
            section_title: `ความถี่การระบุ: ${propDescription}`,
            section_type: "bar_chart",
            what_to_measure: propDescription,
            signal_keywords: Object.keys(freqMap).slice(0, 10).join(", "),
            data: chartData,
            priority: priorityCounter++,
          });
        }
      } else if (
        propType === "NUMBER" ||
        propType === "INTEGER" ||
        (rawValues.length > 0 && typeof rawValues[0] === "number")
      ) {
        const numValues = rawValues
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v));

        if (numValues.length > 0) {
          const sum = numValues.reduce((a, b) => a + b, 0);
          const avg = sum / numValues.length;
          const min = Math.min(...numValues);
          const max = Math.max(...numValues);

          sections.push({
            section_id: `${functionName}_${propName}_scorecard`,
            section_title: `สรุปสถิติตัวเลข: ${propDescription}`,
            section_type: "scorecard",
            what_to_measure: propDescription,
            data: [
              { label: "ค่าเฉลี่ย (Average)", value: Number(avg.toFixed(2)) },
              { label: "ค่าสูงสุด (Max)", value: max },
              { label: "ค่าต่ำสุด (Min)", value: min },
            ],
            priority: priorityCounter++,
          });
        }
      } else {
        const strValues = rawValues.map((v) => String(v).trim()).filter(Boolean);

        if (strValues.length > 0) {
          const freqMap: Record<string, number> = {};
          for (const v of strValues) {
            freqMap[v] = (freqMap[v] || 0) + 1;
          }

          const chartData = Object.entries(freqMap)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);

          const uniqueCount = chartData.length;

          if (uniqueCount <= 10) {
            sections.push({
              section_id: `${functionName}_${propName}_pie`,
              section_title: `สัดส่วนสถิติ: ${propDescription}`,
              section_type: "pie_chart",
              what_to_measure: propDescription,
              data: chartData,
              priority: priorityCounter++,
            });
          } else {
            sections.push({
              section_id: `${functionName}_${propName}_bar`,
              section_title: `ความถี่สถิติ: ${propDescription}`,
              section_type: "bar_chart",
              what_to_measure: propDescription,
              data: chartData.slice(0, 15),
              priority: priorityCounter++,
            });
          }
        }
      }
    }

    // Always generate a summary table section
    const tableData = items.map((item, idx) => {
      const row: Record<string, unknown> = {
        id: (item.id as string | undefined) || `row-${idx}`,
      };

      const sourceText =
        (item.commentText as string | undefined) ||
        (item.text as string | undefined) ||
        (item.postText as string | undefined) ||
        (item.message as string | undefined) ||
        (item.content as string | undefined) ||
        (item.sourceKeyValue !== "aggregate" && item.sourceKeyValue !== "flat-result"
          ? (item.sourceKeyValue as string | undefined)
          : "");
      
      if (sourceText) {
        row["Source Input"] = sourceText;
      }

      for (const propName of Object.keys(properties)) {
        const val = getPropertyValue(item, propName, functionName);
        if (val === undefined || val === null) {
          row[propName] = "-";
        } else if (Array.isArray(val)) {
          row[propName] = val.filter((v) => v !== null && v !== undefined).map(String).join(", ");
        } else {
          row[propName] = val;
        }
      }

      return row;
    });

    if (tableData.length > 0) {
      sections.push({
        section_id: `${functionName}_table`,
        section_title: "ตารางสรุปผลลัพธ์ข้อมูลทั้งหมด (All Item Analysis Grid)",
        section_type: "table",
        what_to_measure: "แสดงรายละเอียดข้อมูลที่สกัดจากโมเดล AI ในรูปแบบตาราง",
        data: tableData,
        priority: 100,
      });
    }

    // Determine overall sentiment focus
    let overallSentimentFocus = "mixed";
    const sentimentProp = Object.keys(properties).find((p) => p.toLowerCase().includes("sentiment"));
    if (sentimentProp) {
      const sentiments = items
        .map((item) => getPropertyValue(item, sentimentProp, functionName))
        .filter((v) => typeof v === "string" && v) as string[];
      if (sentiments.length > 0) {
        const counts: Record<string, number> = {};
        for (const s of sentiments) {
          const lower = s.toLowerCase();
          counts[lower] = (counts[lower] || 0) + 1;
        }
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted[0]) {
          overallSentimentFocus = sorted[0][0];
        }
      }
    }

    return {
      task_intent: functionName,
      task_description: functionDescription,
      sections,
      overall_sentiment_focus: overallSentimentFocus,
      confidence_note: `ประมวลผลสำเร็จและสร้างแดชบอร์ดตามโครงสร้างข้อมูล: ${functionName}`,
    };
  });
}
