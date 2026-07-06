"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { ChatMessageContent, messageHasCode } from "./ChatMessageContent";
import type { ChatMessage } from "@/core/interfaces/loop-projects.interface";

interface ChatMessageListProps {
    messages: ChatMessage[];
    loading: boolean;
    collaborating: boolean;
    isBridgedPending: boolean;
    endRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({ messages, loading, collaborating, isBridgedPending, endRef }: ChatMessageListProps) {
    return (
        <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0 bg-[#0d1526]">
            {messages.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-center p-4">
                    <Sparkles className="size-7 text-indigo-400/60 mb-1.5 animate-pulse" />
                    <h4 className="text-xs font-semibold text-slate-200">Chat Workspace Ready</h4>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5 max-w-[200px]">Type instructions to Chat with Somsri (Developer) or delegate the work to the AI Agent Team.</p>
                </div>
            ) : (
                messages.map((m) => {
                    const isUser = m.role === "user";
                    const isSystem = m.role === "system";
                    const tone = isUser ? "user" : isSystem ? "system" : "assistant";
                    const hasCode = tone === "assistant" && messageHasCode(m.content);
                    return (
                        <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                            <span className="text-[10px] text-slate-500 font-sans mb-0.5 px-1">{m.senderName}</span>
                            <div className={`rounded-lg p-2.5 text-xs select-text leading-relaxed ${hasCode ? "w-full" : "max-w-[85%]"} ${
                                isUser ? "bg-[#23324f] text-slate-100 rounded-tr-none" :
                                isSystem ? "bg-[#141e33] border border-[#24304b] text-slate-400 text-[10px] rounded-none w-full" :
                                "bg-white border border-slate-200/60 text-slate-800 rounded-tl-none"
                            }`}>
                                <ChatMessageContent content={m.content} tone={tone} />
                            </div>
                        </div>
                    );
                })
            )}
            {(loading || collaborating) && !isBridgedPending && (
                <div className="flex flex-col items-start">
                    <span className="text-[10px] text-slate-500 font-sans mb-0.5 px-1">Somsri (Developer)</span>
                    <div className="max-w-[85%] rounded-lg rounded-tl-none border border-slate-200/60 bg-white p-2.5">
                        <span className="flex gap-1">
                            <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                            <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                            <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" />
                        </span>
                    </div>
                </div>
            )}
            <div ref={endRef} />
        </div>
    );
}
