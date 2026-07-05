import { NextResponse } from "next/server";
import { getProjects, saveProjects, applyFileEdits, writeBridgeRequest } from "@/core/services/loop-projects.service";
import { resolveLoopLlm, callLoopLlm } from "@/core/services/loop-llm.service";
import type { ChatMessage } from "@/core/interfaces/loop-projects.interface";
import fs from "fs";
import path from "path";

export async function POST(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const body = await req.json();
        const { message, history } = body;

        // Resolve provider + key from header/body/server-env unless the client
        // forces the IDE bridge. Auto-detects Anthropic (sk-ant-) vs Google AI
        // Studio / Gemini (AIza). With a key present the chat replies live
        // in-app; only when none is configured do we hand off to the IDE agent.
        const forceBridge = body.bridge === true;
        const userKey = req.headers.get("x-anthropic-api-key") || body.apiKey;
        const llm = forceBridge ? null : resolveLoopLlm(userKey);
        if (!llm) {
            const bridgeId = writeBridgeRequest({ taskId, projectId, requestType: "chat", prompt: message, history: history || [] });
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
Strict typography rule: Always use font-sans. The ONLY exception is for raw code blocks, pre-formatted logs, or technical syntax highlights. Using font-mono for UI elements, buttons, headers, or tags is STRICTLY FORBIDDEN.

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
        const apiMessages = [...mappedHistory, { role: "user" as const, content: message }];

        // 4. Call the resolved provider (Claude or Gemini) and normalize usage.
        const result = await callLoopLlm(llm.provider, llm.apiKey, llm.model, systemPrompt, apiMessages);
        const responseContent = result.text;
        const inputTokens = result.input;
        const outputTokens = result.output;
        const cost = result.cost;

        // 5. Apply any file edits returned by Claude
        const editedFiles = applyFileEdits(project.path, responseContent);
        
        // Log changes into task logs
        const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);
        fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
        
        let editLog = "";
        if (editedFiles.length > 0) {
            editLog = `[Build] Somsri (Developer) modified: ${editedFiles.join(", ")}\n`;
            fs.appendFileSync(logFilePath, editLog);
        }

        // 6. Update task in database
        const userMsg: ChatMessage = {
            id: `msg-u-${Date.now()}`,
            role: "user",
            senderName: "User",
            content: message,
            timestamp: new Date().toISOString()
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
