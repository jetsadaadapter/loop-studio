import { NextResponse } from "next/server";
import { getProjects } from "@/core/services/loop-projects.service";
import { resolveLoopLlm, callLoopLlm } from "@/core/services/loop-llm.service";
import { getAgents } from "@/core/services/loop-agents.service";
import { PlanFromGoalSchema, GoalPlanSchema } from "@/core/validators/loop-projects.validator";
import { buildPlanPrompt, parsePlanResponse, enrichPlan, createTasksFromPlan } from "@/core/services/loop-planner.service";

// POST /api/loop-projects/[projectId]/plan
// Decompose a goal into backlog tasks via the Architect agent.
// { goal, apply:false }        → returns the enriched plan as a preview (nothing saved).
// { goal, apply:true, tasks }  → creates backlog tasks from an already-previewed
//                                (possibly user-edited) plan without another LLM call.
// { goal, apply:true }         → plans via LLM and creates immediately.
export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
    try {
        const { projectId } = await context.params;
        const body = await req.json();

        const parsed = PlanFromGoalSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
        }
        const { goal, apply } = parsed.data;

        const project = getProjects().find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        // Apply a plan the client already previewed/edited — no LLM round-trip.
        if (apply && Array.isArray(body.tasks)) {
            const planParsed = GoalPlanSchema.safeParse({ tasks: body.tasks });
            if (!planParsed.success) {
                return NextResponse.json({ success: false, error: planParsed.error.issues[0].message }, { status: 400 });
            }
            const enrichedEdited = await enrichPlan(project.path, planParsed.data);
            const createdEdited = createTasksFromPlan(projectId, goal, enrichedEdited);
            return NextResponse.json({ success: true, data: { preview: false, tasks: createdEdited } });
        }

        // Planning needs a synchronous LLM reply, so the IDE bridge (async,
        // single-slot) is not supported here — a key is required.
        const userKey = req.headers.get("x-anthropic-api-key") || body.apiKey;
        const llm = resolveLoopLlm(userKey);
        if (!llm) {
            return NextResponse.json(
                { success: false, error: "Planning requires an API key (set one on the AI Team page). The IDE bridge is not supported for planning." },
                { status: 400 },
            );
        }

        const architect = getAgents().find((a) => a.id === "agent-somchai");
        const persona = architect?.systemPrompt || "You are a senior software architect.";

        // Plans for broad goals run long; a higher ceiling avoids mid-JSON
        // truncation (parsePlanResponse can still salvage a cut-off reply).
        const res = await callLoopLlm(llm.provider, llm.apiKey, llm.model, buildPlanPrompt(persona), [
            { role: "user", content: `Goal: ${goal}` },
        ], 8000);

        const plan = parsePlanResponse(res.text);
        const enriched = await enrichPlan(project.path, plan);

        if (!apply) {
            return NextResponse.json({
                success: true,
                data: { preview: true, tasks: enriched, tokensUsed: { input: res.input, output: res.output, cost: res.cost } },
            });
        }

        const created = createTasksFromPlan(projectId, goal, enriched);
        return NextResponse.json({
            success: true,
            data: { preview: false, tasks: created, tokensUsed: { input: res.input, output: res.output, cost: res.cost } },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
