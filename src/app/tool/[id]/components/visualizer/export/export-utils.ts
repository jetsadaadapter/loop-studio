"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

function mapOverviewItem(item: Record<string, any>): Record<string, any> {
  const hasSocialFields = item.url || item.facebookUrl || item.text || item.message || item.caption || item.likes !== undefined || item.shares !== undefined;

  // For items without social/post fields (e.g. sentiment analysis results), return all scalar fields directly
  if (!hasSocialFields) {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(item)) {
      if (v !== null && v !== undefined) {
        result[k] = v;
      }
    }
    return result;
  }

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

  const sentiment = item.sentiment || item.analysis?.sentiment || "";
  const summary = item.summary || item.analysis?.summary || "";
  const keywords = item.keywords || item.analysis?.keywords || "";

  return {
    media,
    url,
    text,
    sentiment,
    summary,
    keywords,
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

  // 1. Map items based on the view
  const mappedItems = config.view === "overview" 
    ? slicedItems.map((item) => mapOverviewItem(item))
    : slicedItems;

  // 2. Globally collect keys and filter out empty/internal ones
  const allUniqueKeys = Array.from(
    new Set(mappedItems.flatMap((item) => Object.keys(item)))
  );

  const validKeys = allUniqueKeys.filter((k) => {
    if (["sourceIndex", "sourceKey", "sourceKeyValue"].includes(k)) return false;
    const hasValue = mappedItems.some(item => {
       const val = item[k];
       if (Array.isArray(val) && val.length === 0) return false;
       return val !== null && val !== undefined && val !== "";
    });
    return hasValue;
  });

  // 3. Apply field selections and construct final items
  return mappedItems.map((item) => {
    let activeKeys = validKeys;
    
    // Only apply manual field selections in "All fields" mode
    if (config.view !== "overview") {
      if (config.selectedFields.length > 0) {
        activeKeys = validKeys.filter((k) => config.selectedFields.includes(k));
      }
      if (config.omittedFields.length > 0) {
        activeKeys = activeKeys.filter((k) => !config.omittedFields.includes(k));
      }
    }

    const filteredItem: Record<string, any> = {};
    activeKeys.forEach((k) => {
      // Ensure we don't output undefined values to avoid empty columns
      if (item[k] !== undefined) {
        filteredItem[k] = item[k];
      }
    });
    return filteredItem;
  });
}

/**
 * Formats an array of objects into a human-readable text list for Excel/CSV cells.
 * Example:
 * [Item 1]
 * • key: value
 *
 * [Item 2]
 * • key: value
 */
function formatArrayOfObjectsToText(arr: any[]): string {
  return arr.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      return `[Item ${index + 1}]\n• value: ${item}`;
    }
    let text = `[Item ${index + 1}]\n`;
    for (const [key, val] of Object.entries(item)) {
      if (typeof val === 'object' && val !== null) {
        text += `• ${key}: ${JSON.stringify(val)}\n`;
      } else {
        text += `• ${key}: ${val}\n`;
      }
    }
    return text.trim();
  }).join('\n\n');
}

/**
 * Recursively flattens an object or array into a single-level object.
 * Nested keys become dot-separated (e.g. "user.address.city").
 * Array elements become bracket-indexed (e.g. "tags[0]", "users[0].name").
 * Arrays of primitives are joined by a comma for easier readability.
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  if (obj === null || obj === undefined) {
    if (prefix) result[prefix] = "";
    return result;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (prefix) result[prefix] = "";
      return result;
    }
    const isPrimitiveArray = obj.every(item => typeof item !== 'object' || item === null);
    if (isPrimitiveArray) {
      if (prefix) {
        result[prefix] = obj.filter(x => x !== null && x !== undefined).join(', ');
      }
    } else {
      // Instead of expanding object arrays into separate columns (e.g. comments[0].text, comments[1].text),
      // format them as a readable text list so it stays within a single column, making the table much more readable.
      const formattedList = formatArrayOfObjectsToText(obj);
      if (prefix) {
        result[prefix] = formattedList;
      } else {
        result["value"] = formattedList;
      }
    }
  } else if (typeof obj === 'object') {
    if (obj instanceof Date) {
      if (prefix) result[prefix] = obj.toISOString();
    } else if (Object.keys(obj).length === 0) {
       if (prefix) result[prefix] = "";
    } else {
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        const newKey = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          Object.assign(result, flattenObject(val, newKey));
        } else {
          result[newKey] = val;
        }
      }
    }
  } else {
    if (prefix) {
      result[prefix] = obj;
    } else {
      result["value"] = obj;
    }
  }

  return result;
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

  let itemsToFormat = processedItems;
  // Flatten objects and nested arrays for tabular formats (CSV, Excel, HTML)
  // to ensure they show up correctly for analysis in other statistical programs.
  if (format === "csv" || format === "excel" || format === "html") {
    itemsToFormat = processedItems.map(item => flattenObject(item));
  }

  switch (format) {
    case "json":
      return JSON.stringify(processedItems, null, 2);

    case "jsonl":
      return processedItems.map((item) => JSON.stringify(item)).join("\n");

    case "csv": {
      const headers = Array.from(new Set(itemsToFormat.flatMap((item) => Object.keys(item))));
      const csvRows = [
        headers.join(delimiter),
        ...itemsToFormat.map((item) =>
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
      const headers = Array.from(new Set(itemsToFormat.flatMap((item) => Object.keys(item))));
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
      itemsToFormat.forEach((item) => {
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
      const headers = Array.from(new Set(itemsToFormat.flatMap((item) => Object.keys(item))));
      const csvRows = [
        headers.join(","),
        ...itemsToFormat.map((item) =>
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
