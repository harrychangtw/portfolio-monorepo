"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useLanguage } from "@portfolio/lib/contexts/language-context";

const parseHtmlToReact = (htmlString: string): React.ReactNode => {
  const tagRegex =
    /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>|<strong>([^<]*)<\/strong>/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = tagRegex.exec(htmlString)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = htmlString.substring(lastIndex, match.index);
      if (textBefore)
        parts.push(<span key={`text-${key++}`}>{textBefore}</span>);
    }
    if (match[3] !== undefined) {
      parts.push(
        <strong key={`strong-${key++}`} className="font-medium">
          {match[3]}
        </strong>,
      );
    } else {
      const href = match[1];
      const linkText = match[2];
      parts.push(
        <a
          key={`link-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="link-external"
        >
          {linkText}
        </a>,
      );
    }
    lastIndex = tagRegex.lastIndex;
  }
  if (lastIndex < htmlString.length) {
    const remainingText = htmlString.substring(lastIndex);
    if (remainingText)
      parts.push(<span key={`text-${key++}`}>{remainingText}</span>);
  }
  return parts.length > 0 ? <>{parts}</> : htmlString;
};

export default function UpdatesSection() {
  const { t, getTranslationData } = useLanguage();
  const [rail, setRail] = useState<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updatesNamespaceData = getTranslationData("", "updates");
  const updates: { text: string; date: string }[] = (
    updatesNamespaceData?.entries || []
  ).map((entry: { text?: string; date?: string }) => ({
    date: entry.date || "",
    text: entry.text?.replace(/^\[.*?\]\s*/, "") || "",
  }));

  // Enable/disable the arrows from the rail's scroll position.
  useEffect(() => {
    if (!rail) return;
    const update = () => {
      setAtStart(rail.scrollLeft <= 1);
      setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1);
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(rail);
    return () => {
      rail.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [rail]);

  // Arrows move by one card (card width + gap); snapping settles the rest.
  const step = (dir: 1 | -1) => {
    const card = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !card) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    rail.scrollBy({
      left: dir * (card.offsetWidth + gap),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <section
      id="updates"
      className="py-12 md:py-16 border-b border-border overflow-x-clip"
    >
      <div className="container">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-label">{t("updates.title")}</h2>
          <div className="flex space-x-4">
            {([-1, 1] as const).map((dir) => {
              const disabled = dir === -1 ? atStart : atEnd;
              return (
                <motion.div
                  key={dir}
                  whileHover={disabled ? {} : { y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => step(dir)}
                    disabled={disabled}
                    aria-label={dir === -1 ? "Previous" : "Next"}
                    className="font-heading text-xl text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {dir === -1 ? "←" : "→"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Edge fades sit at the viewport edges (the rail breaks out of the
            container) and only show on a side that has more cards to reveal. */}
        <div className="relative">
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 left-[calc(50%-50vw)] z-10 w-[max(4rem,16vw)] bg-gradient-to-r from-background from-20% via-background/70 to-transparent transition-opacity duration-300 ${atStart ? "opacity-0" : "opacity-100"}`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 right-[calc(50%-50vw)] z-10 w-[max(4rem,16vw)] bg-gradient-to-l from-background from-20% via-background/70 to-transparent transition-opacity duration-300 ${atEnd ? "opacity-0" : "opacity-100"}`}
          />
          <div ref={setRail} className="updates-rail no-scrollbar">
            {updates.map((entry, index) => (
              <article
                key={index}
                className="flex flex-col gap-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                <time className="font-mono text-xs text-secondary/60">
                  {entry.date}
                </time>
                <p className="font-ibm-plex text-sm text-primary leading-relaxed line-clamp-4">
                  {parseHtmlToReact(entry.text)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
