"use client";

export type ExportFormat = "json" | "csv" | "xml" | "excel" | "html" | "rss" | "jsonl";

export interface ExportConfig {
  view: "overview" | "all";
  format: ExportFormat;
  selectedFields: string[];
  omittedFields: string[];
  limit: string;
  offset: string;
  xmlRoot: string;
  csvDelimiter: string;
}

export function mapOverviewItem(item: Record<string, any>): Record<string, any> {
  const media = item.media;
  const url = item.url || item.facebookUrl || "";
  const text = item.text || item.message || item.caption || "";
  
  let likes = "";
  if (item.likes !== undefined && item.likes !== null) {
    likes = item.likes.toLocaleString();
  }

  let comments = "";
  if (item.commentsCount !== undefined && item.commentsCount !== null) {
    comments = item.commentsCount.toLocaleString();
  } else if (typeof item.comments === "number") {
    comments = item.comments.toLocaleString();
  } else if (Array.isArray(item.comments)) {
    comments = item.comments.length.toLocaleString();
  }

  let shares = "";
  if (item.shares !== undefined && item.shares !== null) {
    shares = item.shares.toLocaleString();
  }

  return {
    media,
    url,
    text,
    likes,
    comments,
    shares,
  };
}

export function getProcessedItems(
  items: Record<string, any>[],
  config: ExportConfig
): Record<string, any>[] {
  // Apply offset and limit
  const offsetNum = config.offset ? parseInt(config.offset, 10) : 0;
  const limitNum = config.limit ? parseInt(config.limit, 10) : undefined;
  
  const start = isNaN(offsetNum) ? 0 : Math.max(0, offsetNum);
  const end = limitNum && !isNaN(limitNum) ? start + Math.max(1, limitNum) : undefined;
  
  const slicedItems = items.slice(start, end);

  return slicedItems.map((item) => {
    if (config.view === "overview") {
      return mapOverviewItem(item);
    }

    // "All fields" view: apply whitelists/blacklists
    const keys = Object.keys(item).filter((k) => k !== "analysis"); // Filter out heavy analysis objects
    
    let activeKeys = keys;
    if (config.selectedFields.length > 0) {
      activeKeys = keys.filter((k) => config.selectedFields.includes(k));
    }
    if (config.omittedFields.length > 0) {
      activeKeys = activeKeys.filter((k) => !config.omittedFields.includes(k));
    }

    const filteredItem: Record<string, any> = {};
    activeKeys.forEach((k) => {
      filteredItem[k] = item[k];
    });
    return filteredItem;
  });
}

export function formatDataset(
  processedItems: Record<string, any>[],
  format: ExportFormat,
  options: { xmlRoot?: string; csvDelimiter?: string; runId?: string } = {}
): string {
  const delimiter = options.csvDelimiter || ",";
  const rootName = options.xmlRoot || "results";
  const runId = options.runId || "unknown";

  if (processedItems.length === 0) {
    if (format === "json") return "[]";
    if (format === "jsonl") return "";
    if (format === "xml") return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}></${rootName}>`;
    if (format === "html") return "<table></table>";
    if (format === "rss") return `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0"><channel><title>Empty Export</title></channel></rss>`;
    return "";
  }

  switch (format) {
    case "json":
      return JSON.stringify(processedItems, null, 2);

    case "jsonl":
      return processedItems.map((item) => JSON.stringify(item)).join("\n");

    case "csv": {
      const headers = Array.from(new Set(processedItems.flatMap((item) => Object.keys(item))));
      const csvRows = [
        headers.join(delimiter),
        ...processedItems.map((item) =>
          headers
            .map((header) => {
              const val = item[header];
              const strVal =
                val === null || val === undefined
                  ? ""
                  : typeof val === "object"
                  ? JSON.stringify(val)
                  : String(val);
              // Escape double quotes and surround with quotes if contains special chars or delimiter
              const needsQuotes = strVal.includes(delimiter) || strVal.includes('"') || strVal.includes("\n") || strVal.includes("\r");
              const escaped = strVal.replace(/"/g, '""');
              return needsQuotes ? `"${escaped}"` : escaped;
            })
            .join(delimiter)
        ),
      ];
      // Return with UTF-8 BOM to prevent font corruption in Excel
      return "\uFEFF" + csvRows.join("\n");
    }

    case "xml": {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
      processedItems.forEach((item, idx) => {
        xml += `  <item id="${idx + 1}">\n`;
        Object.entries(item).forEach(([key, val]) => {
          const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
          const strVal =
            val === null || val === undefined
              ? ""
              : typeof val === "object"
              ? JSON.stringify(val)
              : String(val);
          const escapedVal = strVal
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
          xml += `    <${cleanKey}>${escapedVal}</${cleanKey}>\n`;
        });
        xml += "  </item>\n";
      });
      xml += `</${rootName}>`;
      return xml;
    }

    case "html": {
      const headers = Array.from(new Set(processedItems.flatMap((item) => Object.keys(item))));
      let html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>\n`;
      html += `  table { border-collapse: collapse; width: 100%; font-family: sans-serif; }\n`;
      html += `  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n`;
      html += `  th { bg-color: #f2f2f2; font-weight: bold; }\n`;
      html += `  tr:nth-child(even) { background-color: #f9f9f9; }\n`;
      html += `</style>\n</head>\n<body>\n<table>\n  <thead>\n    <tr>\n`;
      headers.forEach((h) => {
        html += `      <th>${h}</th>\n`;
      });
      html += `    </tr>\n  </thead>\n  <tbody>\n`;
      processedItems.forEach((item) => {
        html += "    <tr>\n";
        headers.forEach((h) => {
          const val = item[h];
          const strVal =
            val === null || val === undefined
              ? ""
              : typeof val === "object"
              ? JSON.stringify(val)
              : String(val);
          html += `      <td>${strVal}</td>\n`;
        });
        html += "    </tr>\n";
      });
      html += "  </tbody>\n</table>\n</body>\n</html>";
      return html;
    }

    case "excel": {
      // Excel-compatible CSV format with UTF-8 BOM to prevent Excel mismatch warning and display Thai characters correctly
      const headers = Array.from(new Set(processedItems.flatMap((item) => Object.keys(item))));
      const csvRows = [
        headers.join(","),
        ...processedItems.map((item) =>
          headers
            .map((header) => {
              const val = item[header];
              const strVal =
                val === null || val === undefined
                  ? ""
                  : typeof val === "object"
                  ? JSON.stringify(val)
                  : String(val);
              const needsQuotes = strVal.includes(",") || strVal.includes('"') || strVal.includes("\n") || strVal.includes("\r");
              const escaped = strVal.replace(/"/g, '""');
              return needsQuotes ? `"${escaped}"` : escaped;
            })
            .join(",")
        ),
      ];
      return "\uFEFF" + csvRows.join("\n");
    }

    case "rss": {
      let rss = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
      rss += `  <title>Apify Actor Run Export</title>\n`;
      rss += `  <description>Dataset export for run ID ${runId}</description>\n`;
      rss += `  <link>${typeof window !== "undefined" ? window.location.href : ""}</link>\n`;
      processedItems.forEach((item, idx) => {
        rss += "  <item>\n";
        rss += `    <title>Item #${idx + 1}</title>\n`;
        
        const textVal =
          item.text ||
          item.message ||
          item.caption ||
          `Dataset Entry ${idx + 1}`;
          
        rss += `    <description>${String(textVal)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</description>\n`;
          
        if (item.url || item.facebookUrl) {
          rss += `    <link>${String(item.url || item.facebookUrl)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</link>\n`;
        }
        rss += "  </item>\n";
      });
      rss += "</channel>\n</rss>";
      return rss;
    }

    default:
      return "";
  }
}

export const exportMimeTypes: Record<ExportFormat, string> = {
  json: "application/json",
  jsonl: "application/x-jsonlines",
  csv: "text/csv;charset=utf-8;",
  xml: "application/xml",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  html: "text/html",
  rss: "application/rss+xml",
};

export function getFileExtension(fmt: ExportFormat): string {
  if (fmt === "jsonl") return "jsonl";
  if (fmt === "excel") return "xlsx";
  if (fmt === "html") return "html";
  return fmt;
}
