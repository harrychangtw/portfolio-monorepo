/** Currencies offered in the expense form. The first entry is the default base. */
export const CURRENCIES = [
  "TWD",
  "JPY",
  "USD",
  "EUR",
  "KRW",
  "HKD",
  "CNY",
  "THB",
  "SGD",
  "GBP",
  "AUD",
] as const;

// Currencies settled in whole units in practice, even where ISO says 2 (TWD).
const ZERO_DECIMAL = new Set(["TWD", "JPY", "KRW", "VND", "IDR", "HUF"]);

export function decimals(currency: string): number {
  return ZERO_DECIMAL.has(currency) ? 0 : 2;
}

/** "1,240.5" → 124050 (USD) or 1241 (TWD). Returns null for junk or negatives. */
export function toMinor(input: string, currency: string): number | null {
  const cleaned = input.replace(/[,\s]/g, "");
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === "" || cleaned === ".")
    return null;
  const value = Math.round(Number(cleaned) * 10 ** decimals(currency));
  return Number.isSafeInteger(value) ? value : null;
}

/** Plain number for inputs: 124050 → "1240.50". */
export function fromMinor(minor: number, currency: string): string {
  return (minor / 10 ** decimals(currency)).toFixed(decimals(currency));
}

const formatters = new Map<string, Intl.NumberFormat>();

/** The number alone, grouped: 809700 USD → "8,097.00", 8097 TWD → "8,097". */
export function amount(minor: number, currency: string): string {
  let f = formatters.get(currency);
  if (!f) {
    const d = decimals(currency);
    f = new Intl.NumberFormat("en", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
    formatters.set(currency, f);
  }
  return f.format(minor / 10 ** decimals(currency));
}

/** Number first, code after: "8,097 TWD". */
export function format(minor: number, currency: string): string {
  return `${amount(minor, currency)} ${currency}`;
}

/**
 * Split `total` into integer parts proportional to `weights`, using the
 * largest-remainder method so the parts always sum to exactly `total`.
 * Ties go to the earlier index, which keeps results stable between renders.
 */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const parts = exact.map(Math.floor);
  let left = total - parts.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) {
    parts[order[k].i]++;
  }
  return parts;
}

/** Convert an amount in `from` minor units into `to` minor units at `rate`. */
export function convert(
  minor: number,
  from: string,
  to: string,
  rate: number,
): number {
  if (from === to) return minor;
  return Math.round((minor / 10 ** decimals(from)) * rate * 10 ** decimals(to));
}
