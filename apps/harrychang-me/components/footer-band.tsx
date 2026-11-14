"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@portfolio/lib/contexts/language-context";
import GuestbookWidget from "@/components/guestbook-widget";

const TARGET_CELL = 48; // px; the real size is fitted to the container
const FADE_MS = 700; // how long a lit cell takes to go dark

/**
 * Pick a cell size that divides the container into a whole number of cells,
 * a multiple of 12 on desktop, so the container edges and the page midline
 * (where the guestbook starts) fall exactly on grid lines.
 */
/**
 * Words and the spaces between them, so each word can animate on its own.
 * Intl.Segmenter also splits Chinese, which has no spaces, into words.
 */
function splitWords(text: string): string[] {
  if (typeof Intl === "undefined" || !("Segmenter" in Intl)) {
    return text.split(/(\s+)/).filter(Boolean);
  }
  const out: string[] = [];
  const seg = new Intl.Segmenter(undefined, { granularity: "word" });
  for (const { segment, isWordLike } of seg.segment(text)) {
    const last = out[out.length - 1];
    // Punctuation rides with the word before it so "narrow." never wraps
    // its period onto the next line.
    if (!isWordLike && !/^\s+$/.test(segment) && last && !/^\s+$/.test(last)) {
      out[out.length - 1] = last + segment;
    } else {
      out.push(segment);
    }
  }
  return out;
}

/**
 * Sentences, each keeping its closing punctuation. A Latin . ! ? ends a
 * sentence only before whitespace, so "f/1.5" stays whole; CJK 。！？ need none.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|(?<=[。！？])\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function fitCell(width: number) {
  if (width >= 768) {
    const n = Math.max(12, Math.round(width / (TARGET_CELL * 12)) * 12);
    return width / n;
  }
  return width / Math.max(6, Math.round(width / 40));
}

/**
 * Upper footer band: a statement on the left and the guestbook on the right,
 * over a grid whose cells light up and fade behind the cursor. The guestbook
 * box is sized and placed in whole cells so it sits on the grid.
 */
export default function FooterBand() {
  const { t } = useLanguage();
  const motto = t("footer.motto1");
  const bandRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);

  // Grid geometry, in CSS px relative to the band.
  const geo = useRef({ cell: TARGET_CELL, originX: 0, w: 0, h: 0 });
  const lit = useRef(new Map<string, number>()); // "col,row" → lit-at time
  const frame = useRef<number | null>(null);

  const [cell, setCell] = useState<number | null>(null);
  const [statementRows, setStatementRows] = useState(3);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const band = bandRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const statement = statementRef.current;
    if (!band || !container || !canvas || !statement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const token = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const draw = () => {
      const { cell: s, originX, w, h } = geo.current;
      const now = performance.now();
      ctx.clearRect(0, 0, w, h);

      // Lit cells first, under the lines.
      const fill = token("--primary");
      for (const [key, at] of lit.current) {
        const k = 1 - (now - at) / FADE_MS;
        if (k <= 0) {
          lit.current.delete(key);
          continue;
        }
        const [c, r] = key.split(",").map(Number);
        ctx.fillStyle = `hsl(${fill} / ${0.07 * k})`;
        ctx.fillRect(originX + c * s, r * s, s, s);
      }

      ctx.strokeStyle = `hsl(${token("--border")} / 0.55)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const first = -Math.ceil(originX / s);
      for (let x = originX + first * s; x <= w; x += s) {
        const px = Math.round(x) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
      }
      for (let y = 0; y <= h; y += s) {
        const py = Math.round(y) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
      }
      ctx.stroke();

      frame.current = lit.current.size > 0 ? requestAnimationFrame(draw) : null;
    };

    const requestDraw = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(draw);
    };

    const layout = () => {
      const bandBox = band.getBoundingClientRect();
      const box = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const inner =
        box.width -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const s = fitCell(inner);
      const originX = box.left - bandBox.left + parseFloat(style.paddingLeft);

      geo.current = { cell: s, originX, w: bandBox.width, h: bandBox.height };
      setCell(s);
      setStatementRows(Math.max(1, Math.ceil(statement.offsetHeight / s)));

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(bandBox.width * dpr);
      canvas.height = Math.round(bandBox.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      requestDraw();
    };

    const ro = new ResizeObserver(layout);
    ro.observe(band);
    ro.observe(container);
    ro.observe(statement);

    // Redraw line colors when the theme flips.
    const mo = new MutationObserver(requestDraw);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onMove = (e: PointerEvent) => {
      if (reduceMotion || e.pointerType !== "mouse") return;
      const { cell: s, originX } = geo.current;
      const r = band.getBoundingClientRect();
      const c = Math.floor((e.clientX - r.left - originX) / s);
      const row = Math.floor((e.clientY - r.top) / s);
      lit.current.set(`${c},${row}`, performance.now());
      requestDraw();
    };
    band.addEventListener("pointermove", onMove);

    return () => {
      ro.disconnect();
      mo.disconnect();
      band.removeEventListener("pointermove", onMove);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, []);

  // Before the first measurement, fall back to the target size.
  const s = cell ?? TARGET_CELL;
  // The statement and the guestbook share an even number of cell rows (at
  // least four), both centred in it. The collapsed bar (two cells) then sits
  // on the middle rows and opens one cell up and one cell down, to four.
  const rows = Math.max(4, statementRows + (statementRows % 2));

  const reveal = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.6 },
          transition: {
            duration: 0.8,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section
      ref={bandRef}
      className="relative -mt-px overflow-hidden bg-background"
    >
      {/* Desktop-only backdrop, centred vertically in the band. A
          lazy <img> inside a display:none wrapper is never fetched, so phones
          skip it. The photo is inverted in light mode (globals.css), so text
          keeps the theme's contrast. */}
      <div
        aria-hidden
        className="footer-band-image pointer-events-none absolute inset-0 hidden md:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static backdrop, pre-sized WebP */}
        <img
          src="/images/footer/2025_05_19-v3-1600.webp"
          srcSet="/images/footer/2025_05_19-v3-1600.webp 1600w, /images/footer/2025_05_19-v3-2400.webp 2400w"
          sizes="100vw"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* No hard edge on top: the page background fades into the band,
          over both the photo and the grid lines. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: s * 3,
          backgroundImage:
            "linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background) / 0))",
        }}
      />

      <div ref={containerRef} className="container relative">
        {/* Everything below is measured in whole cells: two rows of air (one on phones)
            above and below, then one shared row of whole cells. */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 py-[var(--cell)] md:py-[calc(var(--cell)*2)]"
          style={
            {
              "--cell": `${s}px`,
              rowGap: s,
            } as React.CSSProperties
          }
        >
          {/* Desktop only: on phones the band is just the guestbook. */}
          <div
            className="hidden md:flex items-center"
            style={{ minHeight: rows * s }}
          >
            <div ref={statementRef}>
              {/* Keyed on the text: switching language remounts it, so the new
                words play their rise instead of staying hidden. */}
              <motion.p
                key={motto}
                initial={reduceMotion ? false : "hidden"}
                whileInView="shown"
                viewport={{ once: true, amount: 0.6 }}
                variants={{ shown: { transition: { staggerChildren: 0.045 } } }}
                // One sentence per line. On desktop each line stays whole and
                // the size scales with the viewport so the longer line fits in
                // half the container (≈2vw, capped at the old 30px).
                // text-box trims the first line to cap height and the last to
                // the baseline, so centring against the guestbook uses the
                // visible letters, not the line box's empty leading.
                className="font-heading text-2xl md:text-[clamp(1rem,2vw,1.875rem)] leading-snug text-primary md:pr-8 [text-box:trim-both_cap_alphabetic]"
              >
                {splitSentences(motto).map((sentence, line) => (
                  <span key={line} className="block md:whitespace-nowrap">
                    {splitWords(sentence).map((seg, i) =>
                      /^\s+$/.test(seg) ? (
                        seg
                      ) : (
                        // Each word rises from behind its own mask. The padding /
                        // negative margin pair keeps descenders inside the mask.
                        <span
                          key={i}
                          className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]"
                        >
                          <motion.span
                            className="inline-block"
                            variants={{
                              hidden: { y: "110%" },
                              shown: {
                                y: "0%",
                                transition: {
                                  duration: 0.7,
                                  ease: [0.22, 1, 0.36, 1] as const,
                                },
                              },
                            }}
                          >
                            {seg}
                          </motion.span>
                        </span>
                      ),
                    )}
                  </span>
                ))}
              </motion.p>
            </div>
          </div>

          <motion.div
            {...reveal(0.5)}
            className="flex items-center"
            style={{ height: rows * s }}
          >
            <GuestbookWidget
              className="w-full"
              size="lg"
              collapsedHeight={s * 2}
              expandedHeight={s * 4}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
