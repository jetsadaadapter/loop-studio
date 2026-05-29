/**
 * Plugin Display Name Configuration
 *
 * Single source of truth for plugin display names used across:
 * - run-client.tsx (Pipeline sidebar in Run Detail page)
 * - history-job-item.tsx (Pipeline Steps in Job History sidebar)
 *
 * Add new plugins here to keep all UI labels consistent.
 */

export interface PluginDisplayConfig {
  /** Short label used in history top-level card & run sidebar step cards */
  cardTitle: string;
  /** Label used inside Pipeline Steps / timeline view */
  stepTitle: string;
  /** Icon path under /images/icons/ — null means use fallback Terminal icon */
  iconSrc: string | null;
  /** Whether to apply animate-pulse to the icon */
  iconAnimate?: boolean;
}

export const PLUGIN_DISPLAY_CONFIG: Record<string, PluginDisplayConfig> = {
  apify: {
    cardTitle: "Apify Scraper",
    stepTitle: "Apify Scraper Engine",
    iconSrc: "/images/icons/apify-symbol-200x200.svg",
    iconAnimate: false,
  },
  gemini: {
    cardTitle: "Gemini AI Analysis",
    stepTitle: "Gemini AI Analysis",
    iconSrc: "/images/icons/gemini-color.svg",
    iconAnimate: true,
  },
};

/** Fallback config when plugin key is not found */
export const DEFAULT_PLUGIN_CONFIG: PluginDisplayConfig = {
  cardTitle: "Automation Run",
  stepTitle: "Automation Stage",
  iconSrc: null,
  iconAnimate: false,
};

/**
 * Helper to get display config for a plugin key.
 * @param pluginKey - raw plugin string (e.g. "apify", "Gemini", "APIFY")
 */
export function getPluginConfig(pluginKey: string): PluginDisplayConfig {
  const normalized = (pluginKey || "").toLowerCase().trim();
  return PLUGIN_DISPLAY_CONFIG[normalized] ?? DEFAULT_PLUGIN_CONFIG;
}
