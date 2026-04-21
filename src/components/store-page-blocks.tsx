/**
 * Config-driven store page block renderer.
 *
 * Each store page declares which showcase blocks it wants via an array of
 * `StorePageBlock` keys. The blocks render in the order they are listed.
 *
 * Usage:
 *   <StorePageBlocks blocks={["hero-banner", "category-ranking"]} />
 */

import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { AppCategoryRanking } from "@/components/app-category-ranking";
import { IntegrationShowcase } from "@/components/integration-showcase";

// ─── Block registry ──────────────────────────────────────────────────────────

export type StorePageBlock =
  | "hero-banner"
  | "category-ranking"
  | "integration-showcase";

type BlockComponent = () => React.ReactNode;

const blockRegistry: Record<StorePageBlock, BlockComponent> = {
  "hero-banner": HeroBannerSlider,
  "category-ranking": AppCategoryRanking,
  "integration-showcase": IntegrationShowcase,
};

// ─── Preset configs for named page layouts ───────────────────────────────────

export const STORE_BLOCK_PRESETS = {
  /** Full marketplace homepage — all three discovery blocks */
  marketplace: [
    "hero-banner",
    "category-ranking",
    "integration-showcase",
  ] satisfies StorePageBlock[],

  /** Detail or sub-pages — no discovery chrome, content-only */
  minimal: [] satisfies StorePageBlock[],

  /** Updates / changelog view — only category ranking for context */
  updates: ["category-ranking"] satisfies StorePageBlock[],
} as const;

// ─── Renderer component ───────────────────────────────────────────────────────

type StorePageBlocksProps = {
  blocks: StorePageBlock[];
};

export function StorePageBlocks({ blocks }: StorePageBlocksProps) {
  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((blockKey) => {
        const Block = blockRegistry[blockKey];
        return <Block key={blockKey} />;
      })}
    </>
  );
}
