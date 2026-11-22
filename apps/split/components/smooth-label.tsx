"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * A label whose width eases to fit new text ("Delete" → "Tap again to
 * delete") and whose text fades in, instead of the button jumping in size.
 * Width is written straight to the DOM, so there's no extra render.
 */
export function SmoothLabel({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const outer = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => fit(outer.current, inner.current, !!text), [text]);
  // Re-measure once the label is actually laid out (e.g. a <dialog> opens).
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!i) return;
    const ro = new ResizeObserver(() => fit(o, i, !!text));
    ro.observe(i);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span
      ref={outer}
      className="inline-block overflow-hidden whitespace-nowrap align-bottom transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
    >
      {/* Empty text collapses to zero width, padding included. */}
      <span
        ref={inner}
        key={text}
        className={`label-fade inline-block ${text ? className : ""}`}
      >
        {text}
      </span>
    </span>
  );
}

function fit(
  o: HTMLSpanElement | null,
  i: HTMLSpanElement | null,
  hasText: boolean,
) {
  if (!o) return;
  const w = i?.offsetWidth ?? 0;
  // Not laid out yet (inside a closed <dialog>): keep the natural width
  // rather than locking to 0, which hid the label until its next change.
  if (!w && hasText) {
    o.style.width = "";
    return;
  }
  // The first real measurement snaps into place; later changes ease.
  if (!o.style.width) {
    o.style.transition = "none";
    o.style.width = `${w}px`;
    void o.offsetWidth;
    o.style.transition = "";
  } else {
    o.style.width = `${w}px`;
  }
}
