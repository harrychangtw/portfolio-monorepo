import { amount } from "@/lib/money";
import { RollingText } from "@/components/rolling-text";

/** Tabular number with its currency code trailing, small and grey. */
export function Money({
  value,
  currency,
  sign = false,
  roll = false,
  className = "",
}: {
  value: number;
  currency: string;
  /** Prefix + or − (and show the magnitude). */
  sign?: boolean;
  /** Animate changed digits (see RollingText). */
  roll?: boolean;
  className?: string;
}) {
  const prefix = sign ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";
  const text = prefix + amount(sign ? Math.abs(value) : value, currency);
  return (
    <span
      className={`num inline-flex items-baseline whitespace-nowrap ${className}`}
    >
      {roll ? <RollingText text={text} value={value} /> : text}
      <span className="ml-1 text-[0.72em] tracking-wide text-secondary">
        {currency}
      </span>
    </span>
  );
}
