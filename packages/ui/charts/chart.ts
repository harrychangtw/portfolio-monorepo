/**
 * Shared types and formatting for content charts. Series take one of five
 * validated categorical slots, in a fixed order, plus a mark shape so that
 * identity never rests on color alone.
 */
export type ChartColor = 1 | 2 | 3 | 4 | 5;
export type ChartShape = "dot" | "ring" | "square" | "diamond" | "triangle";

export interface ChartSeries {
  key: string;
  label: string;
  color: ChartColor;
  shape?: ChartShape;
  /** Line charts only: draw the line dashed. */
  dashed?: boolean;
}

/** "percent" for shares, or the number of decimals to show. */
export type ChartFormat = "percent" | number;

export function formatValue(value: number, format: ChartFormat) {
  if (format !== "percent") return formatNumber(value, format);
  const percent = value * 100;
  if (percent === 0 || percent === 100) return `${percent}%`;
  return `${percent.toFixed(percent < 1 ? 2 : 1)}%`;
}

export function formatTick(tick: number, format: ChartFormat) {
  if (format === "percent") return `${Math.round(tick * 100)}%`;
  return formatNumber(tick, Math.min(format, decimals(tick)));
}

/** Uses a true minus sign and thousands separators. */
function formatNumber(value: number, digits: number) {
  return value
    .toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    .replace("-", "−");
}

function decimals(value: number) {
  const [, fraction = ""] = String(value).split(".");
  return fraction.length;
}

/** Maps a value onto 0–100 within the domain, clamped. */
export function scale([min, max]: [number, number]) {
  return (value: number) =>
    ((Math.min(Math.max(value, min), max) - min) / (max - min)) * 100;
}

export const percentOf = (domain: [number, number]) => {
  const toScale = scale(domain);
  return (value: number) => `${toScale(value).toFixed(2)}%`;
};

export const cx = (...names: (string | false | null | undefined)[]) =>
  names.filter(Boolean).join(" ");

export function markClasses(series: Pick<ChartSeries, "shape" | "color">) {
  return cx(
    "chart-mark",
    `chart-${series.shape ?? "dot"}`,
    `chart-c${series.color}`,
  );
}
