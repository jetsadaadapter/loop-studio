import type { ScrapedJobItem } from "../../../tool-job-utils";

const summaryCandidateKeys = [
  "text",
  "summary",
  "message",
  "result",
  "output",
  "content",
  "response",
];

const excludedKeys = [
  "sourceIndex",
  "sourceKey",
  "sourceKeyValue",
  "analysis",
  "id",
  "_id",
  "createdAt",
  "updatedAt",
  "jobId",
  "postId",
  "url",
  "facebookUrl",
  "postUrl",
  "permalink_url",
  "inputUrl",
  "time",
  "timestamp",
  ...summaryCandidateKeys,
];

function extractLabelFromText(text: string, fallback: string): string {
  // 1. Try to find markdown headings (e.g. ### English Summary, # Thai)
  const headingMatch = text.match(/^\s*(?:#+\s*|\*\*|\*)\s*([^:\n\*\#]+?)(?::\s*|\*\*|\*|\n|$)/);
  if (headingMatch) {
    const candidate = headingMatch[1].trim();
    if (candidate.length > 0 && candidate.length < 25) {
      return candidate;
    }
  }

  // 2. Try to find bold starts like **English Version**
  const boldMatch = text.match(/^\s*\*\*([^\*]+)\*\*/);
  if (boldMatch) {
    const candidate = boldMatch[1].replace(/[:：]/g, "").trim();
    if (candidate.length > 0 && candidate.length < 25) {
      return candidate;
    }
  }

  // 3. Try to find a colon-separated label at the start of the first line (e.g., "English: ...")
  const firstLine = text.split("\n")[0] || "";
  const colonIdx = firstLine.indexOf(":");
  if (colonIdx > 0 && colonIdx < 25) {
    const candidate = firstLine.substring(0, colonIdx).replace(/[\*\#]/g, "").trim();
    if (candidate.length > 0 && candidate.length < 20) {
      return candidate;
    }
  }

  // 4. Heuristic: if first line is short and followed by an empty line, or is the only line
  const lines = text.split("\n").map(l => l.trim());
  if (lines.length > 0) {
    const firstLineText = lines[0];
    if (firstLineText.length > 0 && firstLineText.length < 30) {
      if (lines.length === 1 || lines[1] === "") {
        return firstLineText;
      }
    }
  }

  return fallback;
}

export function parseSingleTextSummary(items: ScrapedJobItem[]) {
  const firstItem = items[0] as Record<string, unknown> | undefined;
  
  const textKey = firstItem
    ? summaryCandidateKeys.find(
        (key) =>
          typeof firstItem[key] === "string" &&
          (firstItem[key] as string).trim().length > 0,
      )
    : undefined;
  const singleTextValue = textKey ? (firstItem?.[textKey] as string) : "";

  const remainingKeys = firstItem
    ? Object.keys(firstItem).filter((key) => {
        if (excludedKeys.includes(key)) return false;
        const val = firstItem[key];
        if (val === null || val === undefined || val === "") return false;
        return true;
      })
    : [];

  const isSingleTextSummary =
    items.length === 1 &&
    textKey !== undefined &&
    typeof singleTextValue === "string" &&
    singleTextValue.trim().length > 0 &&
    remainingKeys.length === 0;

  // Split summary if a separator exists, avoiding splitting markdown tables
  const standalonePipeRegex = /\r?\n\s*\|\s*\r?\n/;
  let summaryParts: string[] = [];
  if (isSingleTextSummary) {
    if (standalonePipeRegex.test(singleTextValue)) {
      summaryParts = singleTextValue.split(standalonePipeRegex).map((part) => part.trim()).filter(Boolean);
    } else if (singleTextValue.includes("|") && !/\|[ \t]*:?-+:?[ \t]*\|/.test(singleTextValue)) {
      const parts = singleTextValue.split("|").map((part) => part.trim()).filter(Boolean);
      // Only split if we have at least 2 parts and each part is substantial (e.g., > 20 chars) to avoid sentence fragments
      if (parts.length > 1 && parts.every(p => p.length > 20)) {
        summaryParts = parts;
      }
    }
  }

  const hasMultipleSummaryTabs = summaryParts.length > 1;

  const summaryTabLabels = summaryParts.map((text) => {
    // Count Thai characters
    const thaiChars = (text.match(/[\u0e00-\u0e7f]/g) || []).length;
    // Count Latin/English alphabetical characters
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    const fallback = thaiChars > englishChars ? "Thai" : "English";
    return extractLabelFromText(text, fallback);
  });

  const uniqueSummaryTabLabels = summaryTabLabels.map((label, idx) => {
    const count = summaryTabLabels.filter((l, i) => l === label && i <= idx).length;
    const total = summaryTabLabels.filter((l) => l === label).length;
    if (total > 1) {
      return `${label} ${count}`;
    }
    return label;
  });

  return {
    isSingleTextSummary,
    singleTextValue,
    summaryParts,
    hasMultipleSummaryTabs,
    uniqueSummaryTabLabels,
  };
}

function isLongTextKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === "text" ||
    normalized === "summary" ||
    normalized === "summary_of_intent" ||
    normalized === "caption" ||
    normalized === "message" ||
    normalized === "posttitle" ||
    normalized === "previewtitle" ||
    normalized === "previewdescription"
  );
}

function isUrlKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === "url" ||
    normalized === "facebookurl" ||
    normalized === "commenturl" ||
    normalized === "inputurl" ||
    normalized === "posturl" ||
    normalized === "permalink_url"
  );
}

function isCompactMetaKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === "classification" ||
    normalized === "sentiment" ||
    normalized === "confidence_score" ||
    normalized === "purchase_intent_signal" ||
    normalized === "likes" ||
    normalized === "likescount" ||
    normalized === "comments" ||
    normalized === "commentscount" ||
    normalized === "shares" ||
    normalized === "viewscount"
  );
}

export function getHeaderColClass(key: string) {
  if (isLongTextKey(key)) return "min-w-72";
  if (isUrlKey(key)) return "min-w-56";
  if (key.toLowerCase() === "keywords") return "min-w-44";
  if (isCompactMetaKey(key)) return "min-w-36";
  return "min-w-36";
}

export function getCellColClass(key: string) {
  if (isLongTextKey(key)) return "whitespace-normal align-top";
  if (isUrlKey(key)) return "whitespace-nowrap align-top";
  return "whitespace-nowrap";
}

export function getValue(item: ScrapedJobItem, key: string) {
  const rawItem = item as Record<string, unknown>;
  if (rawItem[key] !== undefined) return rawItem[key];

  const analysis = rawItem.analysis as Record<string, unknown> | undefined;
  if (analysis && analysis[key] !== undefined) return analysis[key];

  return rawItem[key];
}

export function getAllKeys(items: ScrapedJobItem[], schemaHintKeys: string[]) {
  const baseKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item))),
  ).filter((k) => {
    if (k === "analysis") return false;
    if (k === "media") return true;

    return !items.some((item) => {
      const val = (item as Record<string, unknown>)[k];
      return val !== null && typeof val === "object";
    });
  });

  const hasAnalysis = items.some((item) => item.analysis);
  const analysisKeys = Array.from(
    new Set(
      items.flatMap((item) => {
        const analysis = (item as Record<string, unknown>).analysis as
          | Record<string, unknown>
          | undefined;
        if (!analysis || typeof analysis !== "object") return [];
        return Object.keys(analysis).filter((key) => {
          const value = analysis[key];
          if (value === null || value === undefined) return false;
          if (Array.isArray(value)) return true;
          if (typeof value === "object") {
            return schemaHintKeys.includes(key.toLowerCase());
          }
          return true;
        });
      }),
    ),
  );

  const prioritizedAnalysisKeys = [
    "classification",
    "confidence_score",
    "purchase_intent_signal",
    "sentiment",
    "summary_of_intent",
    "summary",
    "keywords",
  ];

  const orderedAnalysisKeys = [
    ...prioritizedAnalysisKeys.filter((key) => analysisKeys.includes(key)),
    ...schemaHintKeys.filter(
      (key) =>
        analysisKeys.includes(key) && !prioritizedAnalysisKeys.includes(key),
    ),
    ...analysisKeys.filter(
      (key) =>
        !prioritizedAnalysisKeys.includes(key) && !schemaHintKeys.includes(key),
    ),
  ];

  return Array.from(
    new Set(
      hasAnalysis
        ? [
            ...baseKeys.filter(
              (k) =>
                k !== "likes" &&
                k !== "likesCount" &&
                k !== "comments" &&
                k !== "commentsCount" &&
                k !== "shares",
            ),
            ...orderedAnalysisKeys,
            ...baseKeys.filter(
              (k) =>
                k === "likes" ||
                k === "likesCount" ||
                k === "comments" ||
                k === "commentsCount" ||
                k === "shares",
            ),
          ]
        : baseKeys
    )
  );
}

export function isCommentScraperItem(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const raw = item as Record<string, unknown>;
  return Boolean(
    raw.commentId ||
    raw.comment_id ||
    raw.comment_body ||
    raw.profileName ||
    raw.author_name
  );
}

function isValidId(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim();
  return s !== "" && s !== "null" && s !== "undefined";
}

export function normalizeCommentItem(item: Record<string, unknown>): Record<string, unknown> {
  const commentId = String(item.commentId || item.comment_id || item.id || "");
  const profileName = String(item.profileName || item.author_name || item.name || item.author || "User");
  const profilePicture = String(item.profilePicture || item.author_thumbnail || item.author_picture || item.profile_image || item.profile_picture || "");
  const text = String(item.text || item.comment_body || item.message || item.content || "");

  const likesCount = item.likesCount !== undefined ? item.likesCount
    : item.like_count !== undefined ? item.like_count
    : item.likes !== undefined ? item.likes
    : 0;

  const dislikesCount = item.dislikesCount !== undefined ? item.dislikesCount
    : item.dislike_count !== undefined ? item.dislike_count
    : item.unlikes !== undefined ? item.unlikes
    : item.unlike_count !== undefined ? item.unlike_count
    : 0;

  const commentsCount = item.commentsCount !== undefined ? item.commentsCount
    : item.reply_count !== undefined ? item.reply_count
    : typeof item.replies === "number" ? item.replies
    : 0;

  const commentUrl = String(item.commentUrl || item.comment_url || item.comment_permalink || item.permalink || "");

  let date = String(item.date || item.createdAt || item.created_at || "");
  if (!date && item.time) {
    const timeNum = Number(item.time);
    if (!isNaN(timeNum)) {
      date = new Date(timeNum < 1_000_000_000_000 ? timeNum * 1000 : timeNum).toISOString();
    } else {
      date = String(item.time);
    }
  }

  // profileUrl: support Facebook profile_id, YouTube channel ID (UCxxx), or direct URL
  let profileUrl = String(item.profileUrl || item.profile_url || "");
  if (!profileUrl && item.profile_id) {
    const pid = String(item.profile_id);
    if (pid.startsWith("http")) {
      profileUrl = pid;
    } else if (pid.startsWith("UC") || pid.startsWith("HC")) {
      profileUrl = `https://www.youtube.com/channel/${pid}`;
    } else if (pid.startsWith("pfbid") || /^\d+$/.test(pid)) {
      profileUrl = `https://www.facebook.com/${pid}`;
    }
  }

  const rawReplies = (item.comments || item.replies) as Record<string, unknown>[] | undefined;
  const comments = Array.isArray(rawReplies)
    ? rawReplies
        .map(normalizeCommentItem)
        .filter((reply) => {
          // Keep replies that have any valid identity (platform-agnostic)
          return (
            isValidId(reply.profileId || reply.profile_id) ||
            isValidId(reply.facebookId || reply.facebook_id) ||
            isValidId(reply.commentId || reply.comment_id) ||
            (reply.profileName && String(reply.profileName) !== "User" && isValidId(reply.text))
          );
        })
    : undefined;

  return {
    ...item,
    id: commentId,
    commentId,
    profileName,
    profilePicture,
    profileUrl: profileUrl || undefined,
    text,
    likesCount,
    dislikesCount,
    commentsCount,
    commentUrl: commentUrl || undefined,
    date: date || undefined,
    comments,
  };
}

function isStructuredObject(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some(
    (v) => Array.isArray(v) || (typeof v === "object" && v !== null),
  );
}

export function detectStructuredObjectSummary(
  items: ScrapedJobItem[],
): Record<string, unknown> | null {
  if (items.length !== 1) return null;
  const raw = items[0] as Record<string, unknown>;

  // Check top-level non-excluded object keys
  const objectKeys = Object.keys(raw).filter((key) => {
    if (excludedKeys.includes(key)) return false;
    const val = raw[key];
    return val !== null && typeof val === "object" && !Array.isArray(val);
  });

  if (objectKeys.length > 0) {
    const hasNestedStructure = objectKeys.some((key) => {
      const obj = raw[key] as Record<string, unknown>;
      return isStructuredObject(obj);
    });
    if (hasNestedStructure) {
      const result: Record<string, unknown> = {};
      for (const key of objectKeys) {
        result[key] = raw[key];
      }
      return result;
    }
  }

  // Check if analysis field itself is a structured summary (not intent-based)
  const analysis = raw.analysis as Record<string, unknown> | undefined;
  if (analysis && typeof analysis === "object" && !Array.isArray(analysis)) {
    const isIntentBased = "classification" in analysis || "confidence_score" in analysis || "purchase_intent_signal" in analysis;
    if (!isIntentBased && isStructuredObject(analysis)) {
      return analysis;
    }
  }

  // Check if a text/result/summary field contains a JSON string
  for (const key of summaryCandidateKeys) {
    const val = raw[key];
    if (typeof val === "string") {
      const parsed = tryRepairAndParseJson(val);
      if (parsed && isStructuredObject(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function tryRepairAndParseJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed.includes("{")) return null;

  const tryParse = (input: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        return parsed as Record<string, unknown>;
    } catch { /* skip */ }
    return null;
  };

  // Attempt 1: as-is
  const r1 = tryParse(trimmed);
  if (r1) return r1;

  // Attempt 2: extract body
  let s = trimmed;
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const firstBrace = s.indexOf("{");
  if (firstBrace < 0) return null;
  if (firstBrace > 0) s = s.slice(firstBrace);

  if (!s.includes('"') && s.includes("'")) s = s.replace(/'/g, '"');
  s = s.replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":');

  const r2 = tryParse(s);
  if (r2) return r2;

  // Attempt 3: iterative repair (fix errors by position)
  s = s.replace(/,\s*([}\]])/g, "$1");

  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        return parsed as Record<string, unknown>;
      return null;
    } catch (e) {
      const msg = (e as Error).message || "";
      const posMatch = msg.match(/position\s+(\d+)/i) || msg.match(/column\s+(\d+)/i);
      const pos = posMatch ? parseInt(posMatch[1], 10) : -1;

      if (pos < 0) {
        if (msg.includes("Unexpected end")) { s = closeJsonBrackets(s); continue; }
        return null;
      }
      if (msg.includes("after JSON") || msg.includes("non-whitespace")) {
        s = s.slice(0, pos); continue;
      }
      if (msg.includes("]")) { s = s.slice(0, pos) + "]" + s.slice(pos); continue; }
      if (msg.includes("}")) { s = s.slice(0, pos) + "}" + s.slice(pos); continue; }
      if (msg.includes("Unexpected end")) { s = closeJsonBrackets(s); continue; }
      if (msg.includes("Unexpected") || msg.includes("Expected")) {
        s = s.slice(0, pos) + "," + s.slice(pos); continue;
      }
      return null;
    }
  }
  return tryParse(s);
}

function closeJsonBrackets(s: string): string {
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
  }
  if (inString) s += '"';
  while (brackets > 0) { s += "]"; brackets--; }
  while (braces > 0) { s += "}"; braces--; }
  return s;
}
