import type { ComponentType } from "react";

import {
  FingerprintChart,
  LeadReversalChart,
  RecipeGapChart,
  RerunLadderChart,
} from "./castor/charts";

type ChartLang = "en" | "zh-TW";

/**
 * Charts a markdown post can embed by name with
 * `<div class="markdown-chart" data-chart="castor/recipe-gap"></div>`.
 * Each takes the post's language for its titles, captions and labels.
 */
const charts: Record<string, ComponentType<{ lang: ChartLang }>> = {
  "castor/recipe-gap": RecipeGapChart,
  "castor/rerun-ladder": RerunLadderChart,
  "castor/lead-reversal": LeadReversalChart,
  "castor/fingerprint": FingerprintChart,
};

export function MarkdownChart({ name, lang }: { name: string; lang: string }) {
  const Chart = charts[name];
  if (!Chart) return null;
  return <Chart lang={lang === "zh-TW" ? "zh-TW" : "en"} />;
}
