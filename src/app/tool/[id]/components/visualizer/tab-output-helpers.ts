import type { ScrapedJobItem } from "../../tool-job-utils";

export const summaryCandidateKeys = [
  "text",
  "summary",
  "message",
  "result",
  "output",
  "content",
  "response",
];

export const excludedKeys = [
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

  // Split summary if a separator exists
  const summaryParts = isSingleTextSummary && singleTextValue.includes("|")
    ? singleTextValue.split("|").map((part) => part.trim()).filter(Boolean)
    : [];

  const hasMultipleSummaryTabs = summaryParts.length > 1;

  const summaryTabLabels = summaryParts.map((text) => {
    const hasThai = /[\u0e00-\u0e7f]/.test(text);
    return hasThai ? "Thai" : "English";
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

export function isLongTextKey(key: string) {
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

export function isUrlKey(key: string) {
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

export function isCompactMetaKey(key: string) {
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

export function normalizeCommentItem(item: Record<string, unknown>): Record<string, unknown> {
  const commentId = String(item.commentId || item.comment_id || item.id || "");
  const profileName = String(item.profileName || item.author_name || item.author || "User");
  const profilePicture = String(item.profilePicture || item.author_thumbnail || item.author_picture || "");
  const text = String(item.text || item.comment_body || item.message || item.content || "");
  const likesCount = item.likesCount !== undefined ? item.likesCount : (item.like_count !== undefined ? item.like_count : 0);
  const dislikesCount = item.dislikesCount !== undefined ? item.dislikesCount : (item.dislike_count !== undefined ? item.dislike_count : (item.unlikes !== undefined ? item.unlikes : (item.unlike_count !== undefined ? item.unlike_count : 0)));
  const commentsCount = item.commentsCount !== undefined ? item.commentsCount : (item.reply_count !== undefined ? item.reply_count : 0);
  const commentUrl = String(item.commentUrl || item.comment_url || item.permalink || "");

  let date = String(item.date || item.createdAt || "");
  if (!date && item.time) {
    const timeNum = Number(item.time);
    if (!isNaN(timeNum)) {
      const dateObj = new Date(timeNum < 1000000000000 ? timeNum * 1000 : timeNum);
      date = dateObj.toISOString();
    } else {
      date = String(item.time);
    }
  }

  const rawReplies = (item.comments || item.replies) as Record<string, unknown>[] | undefined;
  const comments = Array.isArray(rawReplies) ? rawReplies.map(normalizeCommentItem) : undefined;

  return {
    ...item,
    id: commentId,
    commentId,
    profileName,
    profilePicture,
    text,
    likesCount,
    dislikesCount,
    commentsCount,
    commentUrl: commentUrl || undefined,
    date: date || undefined,
    comments,
  };
}
