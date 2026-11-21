"use client";

import { useState } from "react";

const STAGGER_MS = 25;

/**
 * A number whose changed characters roll: the old one slides out and fades
 * while the new one slides in, rising when the value went up and falling when
 * it went down. Characters line up from the right, so 9,169 → 10,169 only
 * moves the digits that actually changed, rightmost first. Static on first
 * render.
 */
export function RollingText({ text, value }: { text: string; value: number }) {
  const [s, setS] = useState({ text, prev: text, value, up: true, gen: 0 });
  // Derived state: React discards this render and immediately re-renders.
  if (s.text !== text) {
    setS({ text, prev: s.text, value, up: value >= s.value, gen: s.gen + 1 });
  }

  const chars = [...s.text];
  const offset = [...s.prev].length - chars.length;
  const olds = chars.map((_, i) => [...s.prev][i + offset]);
  const changed = chars.map((ch, i) => s.gen > 0 && olds[i] !== ch);
  const dir = s.up ? "up" : "down";

  return (
    <span className="inline-flex" aria-label={s.text}>
      {chars.map((ch, i) => {
        const fromRight = chars.length - 1 - i;
        if (!changed[i]) {
          return (
            <span key={fromRight} aria-hidden>
              {ch}
            </span>
          );
        }
        const rank = changed.slice(i + 1).filter(Boolean).length;
        const delay = { animationDelay: `${rank * STAGGER_MS}ms` };
        return (
          <span
            key={`${fromRight}-${s.gen}`}
            className="relative inline-block"
            aria-hidden
          >
            <span className={`roll-in-${dir} inline-block`} style={delay}>
              {ch}
            </span>
            {olds[i] !== undefined && (
              <span
                className={`roll-out-${dir} absolute inset-0 inline-block`}
                style={delay}
              >
                {olds[i]}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
