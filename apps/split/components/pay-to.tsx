"use client";

import { useState } from "react";
import { methodLabel, type PayMethod } from "@/lib/pay-methods";
import { SmoothLabel } from "@/components/smooth-label";

/**
 * Someone's payment methods on a shaded panel, the same everywhere they
 * appear (Settle up, Balances, People). Copy puts exactly the account on the
 * clipboard; the type and ID sit above it for context.
 */
export function PayTo({
  methods,
  className = "",
}: {
  methods: PayMethod[];
  className?: string;
}) {
  return (
    <ul
      className={`divide-y divide-border overflow-hidden rounded-xl bg-muted px-3.5 text-sm ${className}`}
    >
      {methods.map((m, i) => (
        <li key={i}>
          <MethodRow method={m} />
        </li>
      ))}
    </ul>
  );
}

/** The whole row is the copy button; the hint at the right just confirms it. */
function MethodRow({ method: m }: { method: PayMethod }) {
  const [copied, setCopied] = useState(false);
  const label = methodLabel(m);

  return (
    <button
      type="button"
      title={`Copy ${m.account}`}
      className="group/copy -mx-3.5 flex w-[calc(100%+1.75rem)] items-center justify-between gap-4 px-3.5 py-2.5 text-left copy-row transition-colors"
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(m.account);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      <span className="min-w-0">
        {label && <span className="block text-xs text-secondary">{label}</span>}
        <span
          className={`num block break-all transition-colors ${copied ? "text-accent" : "text-primary"}`}
        >
          {m.account}
        </span>
      </span>
      <span
        className={`shrink-0 text-xs transition-colors ${
          copied
            ? "text-accent"
            : "text-secondary group-hover/copy:text-primary"
        }`}
      >
        <SmoothLabel text={copied ? "Copied" : "Copy"} />
      </span>
    </button>
  );
}
