/**
 * Config-driven store page block renderer.
 *
 * Each store page declares which showcase blocks it wants via an array of
 * `StorePageBlock` keys. The blocks render in the order they are listed.
 *
 * Usage:
 *   <StorePageBlocks blocks={["hero-banner", "category-ranking"]} />
 */

import { StoreHeroBannerBlock } from "@/components/store-hero-banner-block";
import { StoreCategoryRankingBlock } from "@/components/store-category-ranking-block";
import { IntegrationShowcase } from "@/components/integration-showcase";
import { StoreGuidedCtaBlock } from "@/components/store-guided-cta-block";

// ─── Block registry ──────────────────────────────────────────────────────────

export type StorePageBlock =
  | "hero-banner"
  | "category-ranking"
  | "integration-showcase"
  | "guided-cta";

type BlockComponent = () => React.ReactNode;

const blockRegistry: Record<StorePageBlock, BlockComponent> = {
  "hero-banner": StoreHeroBannerBlock,
  "category-ranking": StoreCategoryRankingBlock,
  "integration-showcase": IntegrationShowcase,
  "guided-cta": StoreGuidedCtaBlock,
};

// ─── Preset configs for named page layouts ───────────────────────────────────

export const STORE_BLOCK_PRESETS = {
  /** Library discovery content shown above the main app sections */
  marketplace: ["hero-banner"] satisfies StorePageBlock[],

  /** Library footer CTA shown after the main app sections */
  marketplaceFooter: ["guided-cta"] satisfies StorePageBlock[],

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
