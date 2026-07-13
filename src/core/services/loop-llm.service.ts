import { LOOP_LLM_MODEL } from "@/core/interfaces/loop-projects.interface";

// Multi-provider LLM layer for the Loop Studio chat/collaborate flows.
// Supports Anthropic (Claude) and Google AI Studio (Gemini). The provider is
// auto-detected from the API key so a single key field works for both.
// Anthropic keys have a stable "sk-ant-" prefix; Google AI Studio keys vary by
// format ("AIza…" classic, "AQ.…" newer), so anything that is NOT an Anthropic
// key is treated as Gemini. Server-side env keys are the fallback.

export type LlmProvider = "anthropic" | "gemini";

export interface LlmTextBlock {
    type: "text";
    text: string;
}

export interface LlmImageBlock {
    type: "image";
    mediaType: string; // e.g. "image/png"
    data: string; // base64, WITHOUT the "data:...;base64," prefix
}

// A message's content is plain text, or (for vision) an ordered list of
// image/text blocks — images first, then the accompanying text, matching both
// Anthropic's and Gemini's recommended ordering.
export type LlmContent = string | (LlmTextBlock | LlmImageBlock)[];

export interface LlmMessage {
    role: "user" | "assistant";
    content: LlmContent;
}

export interface LlmResult {
    text: string;
    input: number;
    output: number;
    cost: number;
    provider: LlmProvider;
}

// Default Gemini model (override with LOOP_GEMINI_MODEL). gemini-2.5-flash is
// current and available on the AI Studio free tier via v1beta:generateContent.
// (gemini-1.5-* are retired for newly-issued keys.)
const GEMINI_MODEL = process.env.LOOP_GEMINI_MODEL || "gemini-2.5-flash";

// Approximate pricing (USD per 1M tokens) for the cost readout in the UI.
const PRICING: Record<LlmProvider, { input: number; output: number }> = {
    anthropic: { input: 3, output: 15 },
    gemini: { input: 0.5, output: 3 }, // ~Gemini 3 Flash rate; approximate readout only
};

function costOf(provider: LlmProvider, input: number, output: number): number {
    const p = PRICING[provider];
    return (input * p.input + output * p.output) / 1_000_000;
}

/**
 * Resolve which provider/key/model to use. Priority: caller-supplied key
 * (header or body) > server environment. Returns null when nothing is set,
 * so callers can fall back to the IDE bridge.
 */
export function resolveLoopLlm(userKey?: string | null): { provider: LlmProvider; apiKey: string; model: string } | null {
    const key = (userKey || "").trim();
    if (key) {
        // Anthropic keys start with "sk-ant-"; treat every other key as Gemini
        // (Google's key formats vary and change over time).
        return key.startsWith("sk-ant-")
            ? { provider: "anthropic", apiKey: key, model: LOOP_LLM_MODEL }
            : { provider: "gemini", apiKey: key, model: GEMINI_MODEL };
    }

    const ant = (process.env.ANTHROPIC_API_KEY || process.env.LOOP_ANTHROPIC_API_KEY || "").trim();
    if (ant) return { provider: "anthropic", apiKey: ant, model: LOOP_LLM_MODEL };

    const gem = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    if (gem) return { provider: "gemini", apiKey: gem, model: GEMINI_MODEL };

    return null;
}

// Transient statuses worth retrying (overload / rate limit / gateway).
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);

// POST with exponential backoff on transient errors (e.g. Gemini 503 "high demand").
async function fetchWithRetry(url: string, init: RequestInit, attempts = 5): Promise<Response> {
    let res: Response | null = null;
    for (let i = 0; i < attempts; i++) {
        res = await fetch(url, init);
        if (res.ok || !RETRYABLE_STATUS.has(res.status)) return res;
        if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
    return res as Response;
}

function parseLlmError(provider: LlmProvider, status: number, bodyText: string): Error {
    try {
        const parsed = JSON.parse(bodyText);
        const apiMessage = provider === "gemini" ? parsed.error?.message : parsed.error?.message;
        
        if (status === 503 || (apiMessage && (apiMessage.includes("experiencing high demand") || apiMessage.includes("UNAVAILABLE") || apiMessage.includes("temporary")))) {
            return new Error("The AI service is currently experiencing extremely high demand. Please try again in a few moments, or toggle the IDE Agent Bridge (⚡) in the bottom-left of the chat panel to run locally.");
        }
        if (status === 429 || (apiMessage && (apiMessage.includes("quota") || apiMessage.includes("limit") || apiMessage.includes("exhausted") || apiMessage.includes("too many requests")))) {
            return new Error("API rate limit or quota exceeded. Please wait a moment before trying again, or toggle the IDE Agent Bridge (⚡) in the bottom-left of the chat panel to run locally.");
        }
        if (status === 401 || status === 403 || (apiMessage && (apiMessage.includes("API key") || apiMessage.includes("invalid key") || apiMessage.includes("not found") || apiMessage.includes("unauthorized")))) {
            return new Error("Invalid API key. Please check your API key settings in the AI Team Manager, or toggle the IDE Agent Bridge (⚡) to run locally.");
        }
        if (apiMessage) {
            return new Error(`${provider === "gemini" ? "Gemini" : "Claude"} API error: ${apiMessage}`);
        }
    } catch {
        // parsing failed, fall back
    }
    return new Error(`${provider === "gemini" ? "Gemini" : "Claude"} API error (${status}): ${bodyText.slice(0, 200)}`);
}

function toAnthropicContent(content: LlmContent) {
    if (typeof content === "string") return content;
    return content.map((b) =>
        b.type === "image"
            ? { type: "image", source: { type: "base64", media_type: b.mediaType, data: b.data } }
            : { type: "text", text: b.text },
    );
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, messages: LlmMessage[], maxTokens: number): Promise<LlmResult> {
    const res = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: toAnthropicContent(m.content) })),
        }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw parseLlmError("anthropic", res.status, errText);
    }
    const data = await res.json();
    const input = data.usage?.input_tokens || 0;
    const output = data.usage?.output_tokens || 0;
    return { text: data.content?.[0]?.text || "", input, output, cost: costOf("anthropic", input, output), provider: "anthropic" };
}

function toGeminiParts(content: LlmContent) {
    if (typeof content === "string") return [{ text: content }];
    return content.map((b) =>
        b.type === "image" ? { inlineData: { mimeType: b.mediaType, data: b.data } } : { text: b.text },
    );
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, messages: LlmMessage[], maxTokens: number): Promise<LlmResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetchWithRetry(url, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            // Gemini uses "model" (not "assistant") for the assistant role.
            contents: messages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: toGeminiParts(m.content),
            })),
            generationConfig: { maxOutputTokens: maxTokens },
        }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw parseLlmError("gemini", res.status, errText);
    }
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
    const input = data.usageMetadata?.promptTokenCount || 0;
    const output = data.usageMetadata?.candidatesTokenCount || 0;
    return { text, input, output, cost: costOf("gemini", input, output), provider: "gemini" };
}

/** Call the resolved provider and return normalized text + token/cost usage. */
export async function callLoopLlm(
    provider: LlmProvider,
    apiKey: string,
    model: string,
    systemPrompt: string,
    messages: LlmMessage[],
    maxTokens = 4000,
): Promise<LlmResult> {
    if (provider === "gemini") return callGemini(apiKey, model, systemPrompt, messages, maxTokens);
    return callAnthropic(apiKey, model, systemPrompt, messages, maxTokens);
}
