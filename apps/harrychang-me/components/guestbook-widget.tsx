"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUp, Loader2, Check } from "lucide-react";
import { useLanguage } from "@portfolio/lib/contexts/language-context";
import {
  GUESTBOOK_MAX_LENGTH,
  GUESTBOOK_COUNTER_THRESHOLD,
} from "@/lib/guestbook";

/**
 * Prompt-style guestbook. Collapsed it's one long filled bar showing a cycling
 * prompt; focused it opens into a multi-line box with a send button. Every
 * new line of text (each prompt, the "sent" note) arrives with a faint light
 * sweeping across the letters, like an assistant "thinking".
 */
export default function GuestbookWidget({
  className = "",
  collapsedHeight = 48,
  expandedHeight = 136,
  size = "base",
}: {
  className?: string;
  collapsedHeight?: number;
  expandedHeight?: number;
  /** "lg" sets the prompt at 20px to sit beside display-size text. */
  size?: "base" | "lg";
}) {
  const { t, language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const expanded = isFocused || !!message || status !== "idle";
  // Keep the first line and the send key centred in the collapsed bar.
  const lineHeight = size === "lg" ? 28 : 24;
  const textClass = size === "lg" ? "text-xl leading-7" : "text-base leading-6";
  const textInset = Math.max(8, (collapsedHeight - lineHeight) / 2);
  const keyInset = Math.max(4, (collapsedHeight - 32) / 2);
  const showPrompt = !message && !isFocused && status === "idle";

  // Dynamic placeholders from translation files
  const placeholders = [
    t("guestbook.placeholder1"),
    t("guestbook.placeholder2"),
    t("guestbook.placeholder3"),
    t("guestbook.placeholder4"),
    t("guestbook.placeholder5"),
    t("guestbook.placeholder6"),
    t("guestbook.placeholder7"),
  ];

  // Cycle placeholders
  useEffect(() => {
    if (!showPrompt) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000); // long enough for the shimmer to finish and the line to rest
    return () => clearInterval(interval);
  }, [showPrompt, placeholders.length]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || status === "loading") return;

    setStatus("loading");
    setServerError(null);

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          host: window.location.host,
          path: window.location.pathname + window.location.hash,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      setMessage("");
      setTimeout(() => {
        setStatus("idle");
        inputRef.current?.blur();
        setIsFocused(false);
      }, 2000);
    } catch (error) {
      setStatus("error");
      if (error instanceof Error) {
        setServerError(error.message);
      }
      setTimeout(() => {
        setStatus("idle");
        setServerError(null);
      }, 3000);
    }
  };

  // Enter sends, Shift+Enter breaks the line, Escape closes an empty box.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <motion.div
          // The link footer's card color, so it reads as a piece of the
          // footer in both themes; a faint halo is the only light it gives off.
          className="relative overflow-hidden rounded-lg bg-card cursor-text"
          style={{ boxShadow: "0 0 64px 4px hsl(var(--primary) / 0.07)" }}
          initial={false}
          animate={{ height: expanded ? expandedHeight : collapsedHeight }}
          transition={{
            duration: reduceMotion ? 0 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Cycling prompt (collapsed) / status line (sent, error) */}
          <AnimatePresence mode="wait">
            {showPrompt && (
              <motion.span
                key={placeholderIndex}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ top: textInset }}
                className={`pointer-events-none absolute left-5 right-14 font-body truncate text-shimmer ${textClass}`}
              >
                {placeholders[placeholderIndex]}
              </motion.span>
            )}
            {status === "success" && (
              <motion.span
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ top: textInset }}
                className={`pointer-events-none absolute left-5 right-14 font-body text-shimmer ${textClass}`}
              >
                {t("guestbook.sent")}
              </motion.span>
            )}
          </AnimatePresence>

          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={GUESTBOOK_MAX_LENGTH}
            rows={1}
            aria-label={t("footer.guestbook")}
            placeholder={isFocused ? t("guestbook.focusedPlaceholder") : ""}
            style={{ paddingTop: textInset }}
            className={`absolute inset-0 block w-full h-full resize-none bg-transparent px-5 pb-14 font-body text-primary outline-none placeholder:text-secondary ${textClass}`}
          />

          {/* Character counter — only once the limit is in sight */}
          <AnimatePresence>
            {message.length >=
              GUESTBOOK_MAX_LENGTH - GUESTBOOK_COUNTER_THRESHOLD && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-live="polite"
                className={`absolute left-4 bottom-4 font-mono text-xs tabular-nums ${
                  message.length >= GUESTBOOK_MAX_LENGTH
                    ? "text-red-400"
                    : "text-secondary"
                }`}
              >
                {message.length}/{GUESTBOOK_MAX_LENGTH}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Send: a quiet chip when collapsed, a solid key when open */}
          <button
            type="submit"
            aria-label="Send"
            disabled={status === "loading" || !message.trim()}
            onMouseDown={(e) => e.preventDefault()} // keep focus in the box
            style={{ right: keyInset, bottom: keyInset }}
            className={`absolute flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-300 ${
              expanded
                ? "bg-primary text-background disabled:bg-primary/20 disabled:text-background/70"
                : "bg-transparent text-secondary"
            }`}
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-xs text-red-400 mt-2 truncate"
            >
              {serverError || t("guestbook.error")}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
