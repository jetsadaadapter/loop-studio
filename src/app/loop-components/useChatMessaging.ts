import { useState, useEffect, useRef } from "react";
import { resolveBridge } from "./bridge-client";
import { generateUniqueId } from "./chat-helpers";
import type { ChatMessage, ChatAttachment } from "@/core/interfaces/loop-projects.interface";

interface UseChatMessagingArgs {
    projectId: string;
    taskId: string;
    chatHistory: ChatMessage[];
    onRefresh: () => void;
    onTriggerLog: () => void;
}

/**
 * Owns the conversation state: message list, cost summary, the live/bridge send
 * paths, and IDE-bridge polling. The composer (input/autocomplete) is a separate
 * hook that calls back into `sendMessage`/`collaborate`.
 */
export function useChatMessaging({ projectId, taskId, chatHistory, onRefresh, onTriggerLog }: UseChatMessagingArgs) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
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

    // Stop polling when the panel unmounts.
    useEffect(() => () => bridgeAbortRef.current?.abort(), []);

    // Cancel any in-flight bridge poll (on new send, unmount, or the Cancel button).
    const cancelBridge = () => {
        bridgeAbortRef.current?.abort();
        bridgeAbortRef.current = null;
        setIsBridgedPending(false);
    };

    const toggleBridge = () => {
        setUseBridge((prev) => !prev);
        setIsBridgedPending(false);
    };

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

    const sendMessage = async (content: string, attachments: ChatAttachment[]) => {
        if (loading || collaborating) return;

        const userMsg: ChatMessage = {
            id: generateUniqueId("msg-temp"),
            role: "user",
            senderName: "User",
            content,
            timestamp: new Date().toISOString(),
            ...(attachments.length > 0 ? { attachments } : {}),
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        cancelBridge();

        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Anthropic-API-Key": apiKey
                },
                body: JSON.stringify({ message: content, history: messages, bridge: useBridge, attachments }),
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

    // Returns true when the request was accepted (so the caller can clear input).
    const collaborate = async (instructions: string): Promise<boolean> => {
        if (!instructions.trim() || loading || collaborating) return false;
        setCollaborating(true);
        cancelBridge();
        onTriggerLog();

        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/collaborate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Anthropic-API-Key": apiKey
                },
                body: JSON.stringify({ instructions, bridge: useBridge }),
            });
            const data = await res.json();
            if (data.success) {
                if (data.bridged) {
                    startBridge(data.bridgeId);
                } else {
                    // Poll/Refresh task data periodically during collaboration
                    const interval = setInterval(() => {
                        onRefresh();
                    }, 3000);
                    setTimeout(() => clearInterval(interval), 45000);
                }
                return true;
            }
            return false;
        } catch {
            return false;
        } finally {
            setCollaborating(false);
        }
    };

    // Sending is always allowed: the server resolves a key (user/env) or falls
    // back to the IDE bridge, so we don't block on a missing client-side key.
    const isDisabled = loading || collaborating;

    return {
        messages,
        costSummary,
        loading,
        collaborating,
        isBridgedPending,
        useBridge,
        toggleBridge,
        messagesEndRef,
        cancelBridge,
        sendMessage,
        collaborate,
        isDisabled,
    };
}
