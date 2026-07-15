import { NextResponse } from "next/server";
import { getProjects, saveProjects, applyFileEdits, writeBridgeRequest } from "@/core/services/loop-projects.service";
import { resolveLoopLlm, callLoopLlm, type LlmContent, type LlmImageBlock } from "@/core/services/loop-llm.service";
import { autoFulfillBridge } from "@/core/services/loop-bridge-worker.service";
import type { ChatMessage, ChatAttachment } from "@/core/interfaces/loop-projects.interface";
import fs from "fs";
import path from "path";

// Parses a "data:<mime>;base64,<data>" URL into its parts.
function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    return match ? { mediaType: match[1], data: match[2] } : null;
}

export async function POST(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const body = await req.json();
        const { message, history } = body;
        const attachments = (body.attachments || []) as ChatAttachment[];

        // Resolve provider + key from header/body/server-env unless the client
        // forces the IDE bridge. Auto-detects Anthropic (sk-ant-) vs Google AI
        // Studio / Gemini (AIza). With a key present the chat replies live
        // in-app; only when none is configured do we hand off to the IDE agent.
        const forceBridge = body.bridge === true;
        const userKey = req.headers.get("x-anthropic-api-key") || body.apiKey;
        const llm = forceBridge ? null : resolveLoopLlm(userKey);
        if (!llm) {
            // The IDE agent reads the bridge file from disk, not this HTTP response,
            // so attachments are saved alongside it and referenced by path in the prompt.
            let bridgePrompt = message;
            if (attachments.length > 0) {
                const dir = path.join(process.cwd(), ".antigravity", "attachments", `bridge-${Date.now()}`);
                fs.mkdirSync(dir, { recursive: true });
                const savedPaths = attachments.map((a) => {
                    const parsed = parseDataUrl(a.dataUrl);
                    const filePath = path.join(dir, a.name);
                    if (parsed) fs.writeFileSync(filePath, Buffer.from(parsed.data, "base64"));
                    return path.relative(process.cwd(), filePath);
                });
                bridgePrompt += `\n\nAttached files (read these with your file tool):\n${savedPaths.map((p) => `- ${p}`).join("\n")}`;
            }
            const bridgeId = writeBridgeRequest({ taskId, projectId, requestType: "chat", prompt: bridgePrompt, history: history || [] });
            // Opt-in (LOOP_BRIDGE_AUTO): fulfill the bridge with a local agent
            // instead of waiting for a human. Fire-and-forget — the client polls.
            void autoFulfillBridge(bridgeId).catch(() => { /* worker logs its own errors */ });
            return NextResponse.json({
                success: true,
                bridged: true,
                bridgeId,
                message: "Request bridged to IDE Agent."
            });
        }

        const projects = getProjects();
        const pIdx = projects.findIndex((p) => p.id === projectId);
        if (pIdx === -1) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const project = projects[pIdx];
        const tIdx = project.tasks?.findIndex((t) => t.id === taskId) ?? -1;
        if (tIdx === -1) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        const task = project.tasks[tIdx];

        // 1. Read files contents to provide as LLM context
        let filesContext = "Current files contents:\n\n";
        for (const file of task.targetFiles) {
            const fullPath = path.join(project.path, file);
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, "utf8");
                    filesContext += `--- FILE: ${file} ---\n${content}\n\n`;
                } catch {
                    filesContext += `--- FILE: ${file} ---\n(Could not read file)\n\n`;
                }
            } else {
                filesContext += `--- FILE: ${file} ---\n(File does not exist yet)\n\n`;
            }
        }

        // 2. Setup Somsri Developer Agent system prompt
        const systemPrompt = `You are Somsri (Lead Developer), an expert React/Next.js/TypeScript developer in our Loop Engineering team.
Your task is to write clean, modular code following the user's requirements.
Strict typography rule (applies ONLY to code you generate): use the font-sans Tailwind class in the UI you build; font-mono is forbidden there.

Reply format: write your chat replies in GitHub-flavored Markdown — headings, lists, tables, **bold**, \`inline code\`, and fenced code blocks. Do NOT wrap your reply in HTML tags (no <div>, <span>, <p>, or style attributes) and do not add a font-family style to the reply itself; the chat renders Markdown, not raw HTML. Put any code inside fenced code blocks, or inside <file_edit> tags when creating/editing files.

HOW TO EDIT FILES:
If you need to edit or create files, output the full file contents inside XML-style tags like this:
<file_edit path="src/components/ui/button.tsx">
// Full code contents here
</file_edit>

Make sure to output the ENTIRE file content in the tag. Do not use placeholders or omit existing lines unless you intend to delete them.

${filesContext}
Please address the user request and provide code edits if needed.`;

        // 3. Prepare the conversation. Both providers reject a leading non-user
        // turn, so drop system entries (e.g. the seed "msg-init") and trim any
        // leading assistant turns.
        const mappedHistory = ((history || []) as ChatMessage[])
            .filter((m) => m.role !== "system")
            .map((m) => ({
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: m.content,
            }));
        while (mappedHistory.length > 0 && mappedHistory[0].role !== "user") {
            mappedHistory.shift();
        }

        // Image attachments become vision content blocks (images first, per
        // provider guidance); non-image attachments are noted by name only —
        // their content isn't sent, since parsing arbitrary file types is out of
        // scope here. Past turns never resend attachments (keeps payloads small).
        const imageBlocks: LlmImageBlock[] = attachments
            .filter((a) => a.mimeType.startsWith("image/"))
            .map((a) => {
                const parsed = parseDataUrl(a.dataUrl);
                return parsed ? { type: "image" as const, mediaType: parsed.mediaType, data: parsed.data } : null;
            })
            .filter((b): b is LlmImageBlock => b !== null);
        const otherNames = attachments.filter((a) => !a.mimeType.startsWith("image/")).map((a) => a.name);
        const messageText = otherNames.length > 0 ? `${message}\n\n[Attached files: ${otherNames.join(", ")}]` : message;
        const userContent: LlmContent = imageBlocks.length > 0 ? [...imageBlocks, { type: "text", text: messageText }] : messageText;

        const apiMessages = [...mappedHistory, { role: "user" as const, content: userContent }];

        // 4. Call the resolved provider (Claude or Gemini) and normalize usage.
        const result = await callLoopLlm(llm.provider, llm.apiKey, llm.model, systemPrompt, apiMessages);
        const responseContent = result.text;
        const inputTokens = result.input;
        const outputTokens = result.output;
        const cost = result.cost;

        // 5. Apply any file edits returned by Claude. Interactive chat is
        // human-in-the-loop (the user reads every reply), so test files are
        // allowed here; verifier/build config stays protected.
        const { written: editedFiles, blocked } = applyFileEdits(project.path, responseContent, { allowTestFiles: true });

        // Log changes into task logs
        const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);
        fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

        let editLog = "";
        if (editedFiles.length > 0) {
            editLog = `[Build] Somsri (Developer) modified: ${editedFiles.join(", ")}\n`;
            fs.appendFileSync(logFilePath, editLog);
        }
        if (blocked.length > 0) {
            fs.appendFileSync(logFilePath, blocked.map((b) => `[Build] BLOCKED ${b.path} — ${b.reason}\n`).join(""));
        }

        // 6. Update task in database
        const userMsg: ChatMessage = {
            id: `msg-u-${Date.now()}`,
            role: "user",
            senderName: "User",
            content: message,
            timestamp: new Date().toISOString(),
            ...(attachments.length > 0 ? { attachments } : {}),
        };

        const agentMsg: ChatMessage = {
            id: `msg-a-${Date.now()}`,
            role: "assistant",
            senderName: "Somsri (Developer)",
            content: responseContent,
            timestamp: new Date().toISOString(),
            tokensUsed: { input: inputTokens, output: outputTokens, cost }
        };

        task.chatHistory.push(userMsg, agentMsg);
        
        // Add to activities
        task.activities.push({
            id: `act-chat-${Date.now()}`,
            taskId,
            agentId: "agent-somsri",
            agentName: "Somsri (Developer)",
            stage: "BUILD",
            action: "chat_edit",
            message: editedFiles.length > 0 ? `Modified files: ${editedFiles.join(", ")}` : "Replied in chat",
            timestamp: new Date().toISOString()
        });

        // Add to total tokens used
        task.tokensUsed.input += inputTokens;
        task.tokensUsed.output += outputTokens;
        task.tokensUsed.cost += cost;
        task.updatedAt = new Date().toISOString();

        saveProjects(projects);

        return NextResponse.json({
            success: true,
            data: agentMsg,
            editedFiles,
            totalCost: task.tokensUsed.cost
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
