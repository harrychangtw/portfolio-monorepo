"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@portfolio/lib/contexts/language-context";

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

// Loaded on first open, so Radix and the icons stay out of every post bundle.
const LightboxViewer = dynamic(() => import("./image-lightbox-viewer"), {
  ssr: false,
});

const LightboxContext = createContext<
  ((trigger: HTMLButtonElement) => void) | null
>(null);

/** Open the enclosing lightbox; null outside an ImageLightbox scope. */
export const useImageLightbox = () => useContext(LightboxContext);

/**
 * Lets the ImageContainers inside it expand into a fullscreen viewer. The
 * collection is read from the DOM at open time, so it always matches what
 * is currently rendered, in document order — including images that were
 * still lazy at mount. Images opt out individually (Next Up cards).
 */
export function ImageLightbox({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const { language } = useLanguage();
  const [selection, setSelection] = useState<{
    images: LightboxImage[];
    index: number;
  } | null>(null);

  function open(clicked: HTMLButtonElement) {
    const triggers = Array.from(
      scope.current?.querySelectorAll<HTMLButtonElement>(
        "[data-lightbox-src]",
      ) ?? [],
    );
    const index = triggers.indexOf(clicked);
    if (index < 0) return;
    trigger.current = clicked;
    setSelection({
      index,
      // Only the caption is display text in the viewer; alt stays an alt, so
      // synthesized alt ("Title image 3") never shows up under an image.
      images: triggers.map((el) => ({
        src: el.dataset.lightboxSrc!,
        alt: el.dataset.lightboxAlt ?? "",
        caption: el.dataset.lightboxCaption || undefined,
      })),
    });
  }

  return (
    <LightboxContext.Provider value={open}>
      <div ref={scope}>{children}</div>
      {selection && (
        <LightboxViewer
          images={selection.images}
          index={selection.index}
          language={language}
          onClose={() => setSelection(null)}
          onRestoreFocus={() => trigger.current?.focus({ preventScroll: true })}
        />
      )}
    </LightboxContext.Provider>
  );
}
