"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const [currentPage, setCurrentPage] = useState(0);

  // Measured content height. `null` until the first client measurement, so the
  // server-rendered HTML lays out at its natural height (no CLS on hydration).
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  const updatesNamespaceData = getTranslationData("", "updates");
  const updates = updatesNamespaceData?.entries || [];

  const entriesPerPage = 5;
  const totalPages = Math.ceil(updates.length / entriesPerPage);
  const startIndex = currentPage * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const currentEntries = updates
    .slice(startIndex, endIndex)
    .map((entry: { text?: string; date?: string }) => ({
      ...entry,
      text: entry.text?.replace(/^\[.*?\]\s*/, "") || "",
    }));

  // Track the inner content's natural height; the outer wrapper animates to it.
  useEffect(() => {
    if (!contentEl) return;
    const ro = new ResizeObserver(([entry]) => {
      const next = Math.ceil(
        entry.borderBoxSize?.[0]?.blockSize ?? contentEl.offsetHeight,
      );
      setHeight((prev) => (prev !== next ? next : prev));
    });
    ro.observe(contentEl);
    return () => ro.disconnect();
  }, [contentEl]);

  // Optional: prefers-reduced-motion
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(m.matches); // eslint-disable-line react-hooks/set-state-in-effect
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    m.addEventListener?.("change", handler);
    return () => m.removeEventListener?.("change", handler);
  }, []);

  const handlePrevPage = () => setCurrentPage((p) => (p > 0 ? p - 1 : p));
  const handleNextPage = () =>
    setCurrentPage((p) => (p < totalPages - 1 ? p + 1 : p));

  return (
    <section id="updates" className="py-12 md:py-16 border-b border-border">
      <div className="container">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-label">{t("updates.title")}</h2>
          <div className="flex space-x-4">
            <motion.div
              whileHover={currentPage > 0 ? { y: -2 } : {}}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="font-heading text-xl text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ←
              </button>
            </motion.div>
            <motion.div
              whileHover={currentPage < totalPages - 1 ? { y: -2 } : {}}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="font-heading text-xl text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </motion.div>
          </div>
        </div>

        {/* Outer wrapper animates height; inner wrapper is measured */}
        <div
          style={{
            height: height ?? "auto",
            overflow: "hidden",
            transition:
              height !== null && !reduceMotion
                ? "height 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
          }}
        >
          <div ref={setContentEl}>
            {/* Keyed page content lives inside, but the container remains stable */}
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentPage}
                className="space-y-0"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.2,
                  ease: "easeOut",
                }}
              >
                {currentEntries.map(
                  (entry: { text?: string; date?: string }, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 py-3 first:pt-0 divider-subtle last:border-b-0"
                    >
                      <p className="font-ibm-plex text-sm text-primary leading-relaxed">
                        {parseHtmlToReact(entry.text || "")}
                      </p>
                      <span className="font-mono text-xs text-secondary/50 whitespace-nowrap shrink-0">
                        {entry.date || ""}
                      </span>
                    </div>
                  ),
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
