"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Users, Sparkles, AlertCircle, Coins } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessageList } from "./ChatMessageList";
import { resolveBridge } from "./bridge-client";
import type { ChatMessage } from "@/core/interfaces/loop-projects.interface";

interface ChatPanelProps {
    projectId: string;
    taskId: string;
    chatHistory: ChatMessage[];
    onRefresh: () => void;
    onTriggerLog: () => void;
}

export function ChatPanel({ projectId, taskId, chatHistory, onRefresh, onTriggerLog }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [useBridge, setUseBridge] = useState(false);
    const [isBridgedPending, setIsBridgedPending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [collaborating, setCollaborating] = useState(false);
    const [costSummary, setCostSummary] = useState({ input: 0, output: 0, cost: 0 });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bridgeAbortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages(chatHistory || []);
        if (typeof window !== "undefined") {
            setApiKey(localStorage.getItem("loop_anthropic_api_key") || "");
        }

        // Sum total cost
        const summary = (chatHistory || []).reduce(
            (acc, m) => {
                if (m.tokensUsed) {
                    acc.input += m.tokensUsed.input;
                    acc.output += m.tokensUsed.output;
                    acc.cost += m.tokensUsed.cost;
                }
                return acc;
            },
            { input: 0, output: 0, cost: 0 }
        );
        setCostSummary(summary);
    }, [chatHistory]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Cancel any in-flight bridge poll (on new send, unmount, or the Cancel button).
    const cancelBridge = () => {
        bridgeAbortRef.current?.abort();
        bridgeAbortRef.current = null;
        setIsBridgedPending(false);
    };

    // Stop polling when the panel unmounts.
    useEffect(() => () => bridgeAbortRef.current?.abort(), []);

    // Bridged request: poll the IDE bridge in the background (with backoff); when
    // the agent replies, the reply and any file edits are pulled into the chat.
    const startBridge = (bridgeId?: string) => {
        setIsBridgedPending(true);
        if (!bridgeId) return;
        bridgeAbortRef.current?.abort();
        const controller = new AbortController();
        bridgeAbortRef.current = controller;
        void resolveBridge(projectId, taskId, bridgeId, { signal: controller.signal }).then((outcome) => {
            if (outcome === "cancelled" || controller.signal.aborted) return;
            setIsBridgedPending(false);
            if (outcome === "done") {
                onRefresh();
                onTriggerLog();
            } else {
                setMessages((prev) => [...prev, {
                    id: `msg-bridge-note-${Date.now()}`,
                    role: "system",
                    senderName: "System",
                    content: outcome === "error"
                        ? "IDE bridge returned an error."
                        : "No reply from the IDE agent yet — the request is saved in .antigravity/bridge.json and will appear here once the agent responds.",
                    timestamp: new Date().toISOString(),
                }]);
            }
        });
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || loading || collaborating) return;

        const userMsg: ChatMessage = {
            id: `msg-temp-${Date.now()}`,
            role: "user",
            senderName: "User",
            content: inputValue,
            timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setLoading(true);
        cancelBridge();

        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/${taskId}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Anthropic-API-Key": apiKey
                },
                body: JSON.stringify({ message: userMsg.content, history: messages, bridge: useBridge }),
            });
            const data = await res.json();
            if (data.success) {
                if (data.bridged) {
                    startBridge(data.bridgeId);
                } else {
                    // Show Somsri's reply immediately, then sync full task state.
                    if (data.data) setMessages((prev) => [...prev, data.data as ChatMessage]);
                    onRefresh();
                    onTriggerLog();
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-err-${Date.now()}`,
                        role: "system",
                        senderName: "System Error",
                        content: data.error || "Failed to send message",
                        timestamp: new Date().toISOString()
                    }
                ]);
            }
        } catch {
            // error
        } finally {
            setLoading(false);
        }
    };

    const handleCollaborate = async () => {
        if (!inputValue.trim() || loading || collaborating) return;
        setCollaborating(true);
        cancelBridge();
        onTriggerLog();

        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/${taskId}/collaborate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Anthropic-API-Key": apiKey
                },
                body: JSON.stringify({ instructions: inputValue, bridge: useBridge }),
            });
            const data = await res.json();
            if (data.success) {
                setInputValue("");
                if (data.bridged) {
                    startBridge(data.bridgeId);
                } else {
                    // Poll/Refresh task data periodically during collaboration
                    const interval = setInterval(() => {
                        onRefresh();
                    }, 3000);
                    setTimeout(() => clearInterval(interval), 45000);
                }
            }
        } catch {
            // error
        } finally {
            setCollaborating(false);
        }
    };

    // Sending is always allowed: the server resolves a key (user/env) or falls
    // back to the IDE bridge, so we don't block on a missing client-side key.
    const isDisabled = loading || collaborating;

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/30 flex flex-col h-[550px] shadow-3xs overflow-hidden">
            {/* Header / Cost summary */}
            <div className="bg-white border-b border-slate-200/60 p-3 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Users className="size-4 text-indigo-600" />
                    <span className="font-semibold text-slate-800 text-xs">AI Developer Space</span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <Coins className="size-3 text-amber-500" />
                    <span>${costSummary.cost.toFixed(3)} ({Math.round((costSummary.input + costSummary.output)/1000)}k tokens)</span>
                </div>
            </div>

            {/* Bridge-mode notice (opt-in): requests are handed to the IDE agent */}
            {useBridge && (
                <div className="bg-amber-50 border-b border-amber-200/50 px-3 py-2 shrink-0 flex items-start gap-1.5">
                    <AlertCircle className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-amber-800 leading-normal font-sans">
                        IDE Bridge is on — messages are handed to your IDE agent instead of replying here. Uncheck it to chat live with Somsri, using a key saved in the <Link href="/manage/loop-projects/agents" className="font-semibold underline hover:text-amber-950">AI Team Manager</Link> (or a server-configured key).
                    </span>
                </div>
            )}

            {/* Pending Bridge Banner */}
            {isBridgedPending && (
                <div className="bg-indigo-50 border-b border-indigo-200 px-3 py-2.5 shrink-0 flex items-start gap-2">
                    <Sparkles className="size-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1 text-[10px] text-indigo-800 leading-relaxed font-sans">
                        <span>Bridged to your IDE agent — waiting for a reply. In your IDE, run </span>
                        <code className="bg-indigo-100 border border-indigo-200 px-1 py-0.5 rounded-lg text-[10px] font-semibold font-sans">run bridge</code>
                        <span> (read .antigravity/bridge.json, do the work, write the reply back). Updates here automatically.</span>
                    </div>
                    <button
                        type="button"
                        onClick={cancelBridge}
                        className="shrink-0 rounded-sm border border-indigo-200 bg-white px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <ChatMessageList
                messages={messages}
                loading={loading}
                collaborating={collaborating}
                isBridgedPending={isBridgedPending}
                endRef={messagesEndRef}
            />

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/60 shrink-0 space-y-2">
                <Textarea
                    rows={2}
                    disabled={isDisabled}
                    placeholder={isDisabled ? "Select a mode or set API Key first..." : "e.g. Implement rounded options or fix the margin in button.tsx..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="min-h-0 rounded-lg px-3 py-2 text-xs focus-visible:ring-indigo-500/40 focus-visible:ring-offset-0 leading-relaxed"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 font-sans font-medium select-none">
                        <input
                            type="checkbox"
                            checked={useBridge}
                            onChange={(e) => {
                                setUseBridge(e.target.checked);
                                setIsBridgedPending(false);
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-550 size-3"
                        />
                        <span>Use IDE Agent Bridge (Free)</span>
                    </label>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleCollaborate}
                            disabled={isDisabled || !inputValue.trim()}
                            className="flex items-center gap-1.5 rounded-sm border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 cursor-pointer shadow-3xs"
                            title="Start Multi-Agent Team execution loop in background"
                        >
                            <Users className="size-3.5" />
                            {collaborating ? "Delegating..." : "Delegate"}
                        </button>
                        
                        <button
                            type="submit"
                            disabled={isDisabled || !inputValue.trim()}
                            className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                            <Send className="size-3.5" />
                            {loading ? "Sending..." : "Send"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
