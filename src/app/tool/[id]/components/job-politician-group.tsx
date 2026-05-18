"use client";

import Image from "next/image";
import { User, ExternalLink } from "lucide-react";
import type { ScrapedJobItem, ScrapedComment } from "../tool-job-utils";

type JobPoliticianGroupProps = {
  uniquePoliticians: string[];
  items: ScrapedJobItem[];
};

export function JobPoliticianGroup({
  uniquePoliticians,
  items,
}: JobPoliticianGroupProps) {
  return (
    <>
      {uniquePoliticians.map((politician, index) => {
        const politicianComments: Array<{
          authorName?: string;
          text: string;
          postUrl?: string;
          postPage?: string;
          profilePic?: string;
        }> = [];

        items.forEach((typedItem) => {
          const comments = Array.isArray(typedItem.comments)
            ? typedItem.comments
            : [];
          const pageProfilePic = typedItem.user?.profilePic || "";
          comments.forEach((comment: ScrapedComment) => {
            if (
              comment.mentions?.some((m: string) =>
                m.toLowerCase().includes(politician.toLowerCase()),
              )
            ) {
              politicianComments.push({
                authorName: comment.authorName,
                text: comment.text,
                postUrl: String(typedItem.url || typedItem.facebookUrl || ""),
                postPage: String(typedItem.pageName || typedItem.postId || ""),
                profilePic: pageProfilePic,
              });
            }
          });
        });

        return (
          <div
            key={`${politician}-${index}`}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md"
          >
            <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                  <User className="size-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800">
                    {politician}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {politicianComments.length} mentions across all scraped links
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto bg-slate-50/30">
              {politicianComments.length > 0 ? (
                politicianComments.map((comment, commentIdx) => (
                  <div
                    key={commentIdx}
                    className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2.5 transition-all hover:scale-[1.005]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        {comment.profilePic ? (
                          <Image
                            src={comment.profilePic}
                            width={20}
                            height={20}
                            unoptimized
                            className="size-5 rounded-full object-cover border border-slate-200"
                            alt={comment.postPage || "Profile pic"}
                          />
                        ) : (
                          <div className="size-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                            {comment.postPage?.charAt(0) || "P"}
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">
                          {comment.postPage}
                        </span>
                      </div>
                      <span className="font-bold text-brand text-[10px]">
                        👤 {comment.authorName || "Anonymous User"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-650 leading-relaxed italic font-medium">
                        &quot;{comment.text}&quot;
                      </p>
                      {comment.postUrl && (
                        <a
                          href={comment.postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-semibold text-slate-400 hover:text-brand flex items-center gap-1 transition-colors shrink-0 ml-4"
                        >
                          View Post <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No comments found matching this politician.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
