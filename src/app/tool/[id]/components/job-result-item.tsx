"use client";

import Image from "next/image";
import { CheckCircle2, ExternalLink } from "lucide-react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import {
  getAnalysisDisplayPresetForJob,
  getSchemaHintKeysFromJob,
} from "../tool-job-utils";
import type {
  AnalysisResult,
  ScrapedJobItem,
  SourceItem,
} from "../tool-job-utils";
import { JobAiAnalysis } from "./job-ai-analysis";
import { JobEngagementStats } from "./job-engagement-stats";

type JobResultItemProps = {
  item: NonNullable<ToolJob["result"]>["items"][0];
  idx: number;
  job: ToolJob;
};

export function JobResultItem({ item, idx, job }: JobResultItemProps) {
  const schemaHintKeys = getSchemaHintKeysFromJob(job);
  const analysisDisplayPreset = getAnalysisDisplayPresetForJob(job);
  const itemText = typeof item.text === "string" ? item.text : "";
  const inputItems =
    (job.input?.previousResults as { items?: SourceItem[] })?.items || [];
  const sourceItem: SourceItem =
    inputItems.find(
      (ii) =>
        ii.postId === item.sourceKeyValue ||
        ii.id === item.sourceKeyValue ||
        ii._id === item.sourceKeyValue ||
        ii.url === item.sourceKeyValue,
    ) || {};

  const typedItem = item as unknown as ScrapedJobItem;
  const typedSource = sourceItem as unknown as ScrapedJobItem;

  const sourceText =
    itemText ||
    sourceItem.text ||
    sourceItem.message ||
    sourceItem.caption ||
    sourceItem.content ||
    "";
  const analysis = (item.analysis as AnalysisResult) || {};

  const profilePic = String(
    typedItem.user?.profilePic || typedSource.user?.profilePic || "",
  );
  const likes =
    typeof typedItem.likes === "number"
      ? typedItem.likes
      : typeof typedSource.likes === "number"
        ? typedSource.likes
        : undefined;
  const shares =
    typeof typedItem.shares === "number"
      ? typedItem.shares
      : typeof typedSource.shares === "number"
        ? typedSource.shares
        : undefined;
  const viewsCount =
    typeof typedItem.viewsCount === "number"
      ? typedItem.viewsCount
      : typeof typedSource.viewsCount === "number"
        ? typedSource.viewsCount
        : undefined;

  const reactionLikeCount =
    typeof typedItem.reactionLikeCount === "number"
      ? typedItem.reactionLikeCount
      : typeof typedSource.reactionLikeCount === "number"
        ? typedSource.reactionLikeCount
        : undefined;
  const reactionLoveCount =
    typeof typedItem.reactionLoveCount === "number"
      ? typedItem.reactionLoveCount
      : typeof typedSource.reactionLoveCount === "number"
        ? typedSource.reactionLoveCount
        : undefined;
  const reactionCareCount =
    typeof typedItem.reactionCareCount === "number"
      ? typedItem.reactionCareCount
      : typeof typedSource.reactionCareCount === "number"
        ? typedSource.reactionCareCount
        : undefined;
  const reactionHahaCount =
    typeof typedItem.reactionHahaCount === "number"
      ? typedItem.reactionHahaCount
      : typeof typedSource.reactionHahaCount === "number"
        ? typedSource.reactionHahaCount
        : undefined;
  const reactionWowCount =
    typeof typedItem.reactionWowCount === "number"
      ? typedItem.reactionWowCount
      : typeof typedSource.reactionWowCount === "number"
        ? typedSource.reactionWowCount
        : undefined;
  const reactionSadCount =
    typeof typedItem.reactionSadCount === "number"
      ? typedItem.reactionSadCount
      : typeof typedSource.reactionSadCount === "number"
        ? typedSource.reactionSadCount
        : undefined;
  const reactionAngryCount =
    typeof typedItem.reactionAngryCount === "number"
      ? typedItem.reactionAngryCount
      : typeof typedSource.reactionAngryCount === "number"
        ? typedSource.reactionAngryCount
        : undefined;
  const commentsCount =
    typeof typedItem.commentsCount === "number"
      ? typedItem.commentsCount
      : typeof typedItem.comments === "number"
        ? typedItem.comments
        : Array.isArray(typedItem.comments)
          ? typedItem.comments.length
          : typeof typedSource.commentsCount === "number"
            ? typedSource.commentsCount
            : typeof typedSource.comments === "number"
              ? typedSource.comments
              : undefined;
  const getFirstThumbnail = (
    media: Array<{ thumbnail?: string } | null | undefined> | undefined,
  ) => {
    if (!Array.isArray(media)) return "";
    const found = media.find(
      (m) => m && typeof m.thumbnail === "string" && m.thumbnail,
    );
    return found?.thumbnail || "";
  };
  const thumbnail = String(
    getFirstThumbnail(typedItem.media) ||
      getFirstThumbnail(typedSource.media) ||
      "",
  );

  const displayName = String(
    (typeof item.pageName === "string" ? item.pageName : "") ||
      sourceItem.pageName ||
      item.postId ||
      item.sourceKeyValue ||
      `Item ${idx + 1}`,
  );

  const postUrl = String(item.url || item.facebookUrl || sourceItem.url || "");

  const rawTime =
    typedItem.time || typedSource.time || item.time || sourceItem.time;
  const rawTimestamp = typedItem.timestamp || typedSource.timestamp;

  const postDateString = (() => {
    const timeVal = (rawTime ||
      (typeof rawTimestamp === "number" && rawTimestamp > 0
        ? rawTimestamp < 99999999999
          ? rawTimestamp * 1000
          : rawTimestamp
        : null)) as string | number | Date;
    if (timeVal) {
      const parsedDate = new Date(timeVal);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
    return "Posted recently";
  })();

  const renderTextWithHashtags = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={i}
            className="text-brand font-semibold hover:underline cursor-pointer transition-colors duration-150"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 w-full">
      {/* 1. Header Area: Social Media Profile Info */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          {profilePic ? (
            <div className="relative size-10 rounded-full overflow-hidden border border-slate-200 shadow-sm shrink-0">
              <Image
                src={profilePic}
                alt={displayName}
                fill
                unoptimized
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="size-10 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold border border-brand/20 shrink-0">
              {idx + 1}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 truncate max-w-50 block">
                {displayName}
              </span>
              <CheckCircle2 className="size-4 text-emerald-500 fill-emerald-50 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              {postDateString}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {postUrl && (
            <a
              href={postUrl}
              target="_blank"
              rel="noreferrer"
              title="Open original post"
              className="p-2 text-slate-400 hover:text-brand hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm bg-slate-50/50"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Post Card Content & AI Analysis */}
      <div className="p-6 space-y-6">
        {/* 2. Post text / caption with tags */}
        <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
          {sourceText ? (
            renderTextWithHashtags(sourceText)
          ) : (
            <p className="text-slate-400 italic">No text content available.</p>
          )}
        </div>

        {/* 3. Media Picture / Video Thumbnail */}
        {thumbnail && (
          <div className="relative -mx-6 overflow-hidden border-y border-slate-100/80 shadow-xs h-80 bg-slate-50 group">
            <Image
              src={thumbnail}
              alt="Post Media Content"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLElement).parentElement!.style.display = "none";
              }}
            />
          </div>
        )}

        {/* 4. Bottom Social Engagement Stats */}
        <JobEngagementStats
          viewsCount={viewsCount}
          likes={likes}
          commentsCount={commentsCount}
          shares={shares}
          reactionLikeCount={reactionLikeCount}
          reactionLoveCount={reactionLoveCount}
          reactionCareCount={reactionCareCount}
          reactionHahaCount={reactionHahaCount}
          reactionWowCount={reactionWowCount}
          reactionSadCount={reactionSadCount}
          reactionAngryCount={reactionAngryCount}
        />

        {/* 5. INTEGRATED AI ANALYSIS ZONE */}
        <JobAiAnalysis
          analysis={analysis}
          comments={Array.isArray(typedItem.comments) ? typedItem.comments : []}
          schemaHintKeys={schemaHintKeys}
          analysisDisplayPreset={analysisDisplayPreset}
        />
      </div>
    </div>
  );
}
