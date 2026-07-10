"use client";

import { Avatar } from "@humation/react";
import { humation1, manifestJson } from "@humation/assets-humation-1";

interface AgentAvatarProps {
    /** Stable seed (agent id) so the face doesn't change on rename. */
    seed: string;
    /** Used for the accessible title. */
    name: string;
    /** Pixel size of the square avatar. */
    size: number;
    /** Drives gendered hair/clothing; defaults to male when unset. */
    gender?: "male" | "female";
    /** Extra classes for the circular wrapper (e.g. ring). */
    className?: string;
}

// Resolve human-readable part labels (e.g. "long-straight") to their canonical
// ids from the manifest, so gender selections stay readable and version-safe.
const PART_ID: Record<string, string> = {};
for (const p of (manifestJson as unknown as { parts: { id: string; name?: string }[] }).parts) {
    if (p.name) PART_ID[p.name] = p.id;
}

// Gendered pools — hairstyles ("head" slot) and lower garments ("bottom" slot).
const HAIR = {
    female: ["long-straight", "wavy-long", "ponytail", "bun", "braids", "blunt-bob", "low-twin-buns", "curly-long", "lob"],
    male: ["short", "curly-short", "short-bangs", "side-swept-short", "messy-short", "wavy-medium"],
};
const BOTTOM = {
    female: ["long-skirt", "midi-skirt", "flared-skirt", "mini-skirt"],
    male: ["wide-pants", "tapered-pants", "cropped-pants"],
};

// Deterministic colour palettes for variety (natural hair, skin tones, and a
// vivid clothes/background set) — picked per seed so each agent looks distinct.
const HAIR_COLORS = ["2C1B18", "4A3728", "6B4423", "8D5524", "B55239", "1A1A1A", "5C4033", "A0522D"];
const SKIN = ["FCE0C8", "F1C27D", "E0AC69", "C68642", "8D5524", "FFDFC4"];
const CLOTHES = ["6366F1", "10B981", "F59E0B", "EF4444", "0EA5E9", "8B5CF6", "14B8A6", "EC4899"];
const BG = ["EDE9FE", "E0E7FF", "DCFCE7", "FEF3C7", "FFE4E6", "CFFAFE", "CCFBF1"];

function hashSeed(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}
const pick = <T,>(arr: T[], n: number): T => arr[n % arr.length];

// Deterministic illustrated avatar rendered fully offline as inline SVG
// (@humation/react, MIT), with gender-matched hair/clothing and per-seed colours.
export function AgentAvatar({ seed, name, size, gender, className = "" }: AgentAvatarProps) {
    const g = gender === "female" ? "female" : "male";
    const h = hashSeed(seed || name || "agent");

    const selections: Record<string, string> = {};
    const head = PART_ID[pick(HAIR[g], h)];
    const bottom = PART_ID[pick(BOTTOM[g], h >> 3)];
    if (head) selections.head = head;
    if (bottom) selections.bottom = bottom;

    const colors = {
        hair: `#${pick(HAIR_COLORS, h >> 2)}`,
        skin: `#${pick(SKIN, h >> 5)}`,
        clothes: `#${pick(CLOTHES, h >> 7)}`,
    };
    const background = `#${pick(BG, h >> 9)}`;

    return (
        <span
            style={{ width: size, height: size }}
            className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
        >
            <Avatar
                assets={humation1}
                seed={seed}
                selections={selections}
                colors={colors}
                background={background}
                size={size}
                title={name}
            />
        </span>
    );
}
