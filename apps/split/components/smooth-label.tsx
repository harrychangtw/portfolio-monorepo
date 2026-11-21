"use client";

import { useLayoutEffect, useRef } from "react";

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

  useLayoutEffect(() => {
    if (outer.current && inner.current) {
      outer.current.style.width = `${inner.current.offsetWidth}px`;
    }
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
