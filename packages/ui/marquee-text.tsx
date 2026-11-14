"use client";

import { useEffect, useRef, useState } from "react";

const MARQUEE_GAP = 48; // px between the title and its trailing copy
const MARQUEE_SPEED = 40; // px per second
const MARQUEE_HOLD = 1200; // ms resting at the start of each loop

/**
 * One-line text that, when `active` and too long to fit, scrolls left the way
 * Apple Music scrolls song titles: rest, glide until a trailing copy reaches
 * the start, repeat. Text that fits never moves; truncated text fades out at
 * the right edge instead of ending in an ellipsis.
 */
export default function MarqueeText({
  children,
  active,
  className,
  as: Tag = "span",
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  className?: string;
  /** Element for the clipping box; "h3" for card titles. */
  as?: "span" | "div" | "h3";
  /** Full text, shown as a tooltip while truncated. */
  title?: string;
}) {
  const boxRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const playing = active && overflowing;

  useEffect(() => {
    const box = boxRef.current;
    const label = textRef.current;
    if (!box || !label) return;
    const measure = () =>
      setOverflowing(label.offsetWidth > box.clientWidth + 1);
    // ResizeObserver also fires once on observe, which covers the first measure.
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    // The title's own width changes when the web font swaps in.
    ro.observe(label);
    return () => ro.disconnect();
  }, [children]);

  useEffect(() => {
    const track = trackRef.current;
    const label = textRef.current;
    if (!playing || !track || !label) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const distance = label.offsetWidth + MARQUEE_GAP;
    const duration = (distance / MARQUEE_SPEED) * 1000 + MARQUEE_HOLD;
    const anim = track.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(0)", offset: MARQUEE_HOLD / duration },
        { transform: `translateX(-${distance}px)`, offset: 1 },
      ],
      { duration, iterations: Infinity, easing: "linear" },
    );
    return () => anim.cancel();
  }, [playing]);

  const fade = playing
    ? "linear-gradient(to right, transparent, black 16px, black calc(100% - 24px), transparent)"
    : overflowing
      ? "linear-gradient(to right, black calc(100% - 32px), transparent)"
      : undefined;

  return (
    <Tag
      ref={boxRef as React.RefObject<never>}
      title={overflowing ? title : undefined}
      className={`block overflow-hidden whitespace-nowrap ${className || ""}`}
      style={fade ? { maskImage: fade, WebkitMaskImage: fade } : undefined}
    >
      <span ref={trackRef} className="inline-block will-change-transform">
        <span ref={textRef} className="inline-block">
          {children}
        </span>
        {overflowing && (
          <span aria-hidden style={{ paddingLeft: MARQUEE_GAP }}>
            {children}
          </span>
        )}
      </span>
    </Tag>
  );
}
