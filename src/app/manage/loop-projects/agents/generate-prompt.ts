import { AVAILABLE_SKILLS } from "@/core/interfaces/loop-projects.interface";

export function generateSystemPrompt(name: string, role: string, skillKeys: string[]): string {
    const skills = AVAILABLE_SKILLS.filter((s) => skillKeys.includes(s.key));
    const skillLines = skills.map((s) => `- ${s.label}: ${s.description}`).join("\n");
    const who = name.trim() || "an AI developer";
    const position = role.trim() || "Software Engineer";
    return [
        `You are ${who}, working as a ${position} on this project.`,
        ``,
        `Your job is to act within the scope of your role, collaborate with the rest of the autonomous team, and deliver high-quality, reviewable changes.`,
        skills.length
            ? `\nAreas of expertise:\n${skillLines}`
            : ``,
        `\nFollow the repository's engineering standards (AGENTS.md) and design system (DESIGN.md). Make surgical, behavior-preserving changes, keep files modular, validate inputs at boundaries, and communicate in a professional, constructive tone.`,
    ]
        .filter(Boolean)
        .join("\n");
}
