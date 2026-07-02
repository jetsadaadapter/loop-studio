/**
 * Config-driven store page block renderer.
 *
 * Each store page declares which showcase blocks it wants via an array of
 * `LibraryPageBlock` keys. The blocks render in the order they are listed.
 *
 * Usage:
 *   <LibraryPageBlocks blocks={["hero-banner", "category-ranking"]} />
 */

import { LibraryHeroBannerBlock } from "@/components/library-hero-banner-block";
import { LibraryCategoryRankingBlock } from "@/components/library-category-ranking-block";
import { IntegrationShowcase } from "@/components/integration-showcase";
import { LibraryGuidedCtaBlock } from "@/components/library-guided-cta-block";

// ─── Block registry ──────────────────────────────────────────────────────────

type LibraryPageBlock =
  | "hero-banner"
  | "category-ranking"
  | "integration-showcase"
  | "guided-cta";

type BlockComponent = () => React.ReactNode;

const blockRegistry: Record<LibraryPageBlock, BlockComponent> = {
  "hero-banner": LibraryHeroBannerBlock,
  "category-ranking": LibraryCategoryRankingBlock,
  "integration-showcase": IntegrationShowcase,
  "guided-cta": LibraryGuidedCtaBlock,
};

// ─── Preset configs for named page layouts ───────────────────────────────────

export const LIBRARY_BLOCK_PRESETS = {
  /** Library discovery content shown above the main app sections */
  marketplace: ["hero-banner"] satisfies LibraryPageBlock[],

  /** Library footer CTA shown after the main app sections */
  marketplaceFooter: ["guided-cta"] satisfies LibraryPageBlock[],

  /** Detail or sub-pages — no discovery chrome, content-only */
  minimal: [] satisfies LibraryPageBlock[],

  /** Updates / changelog view — only category ranking for context */
  updates: ["category-ranking"] satisfies LibraryPageBlock[],
} as const;

// ─── Renderer component ───────────────────────────────────────────────────────

type LibraryPageBlocksProps = {
  blocks: LibraryPageBlock[];
};

export function LibraryPageBlocks({ blocks }: LibraryPageBlocksProps) {
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
