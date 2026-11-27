"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Language } from "@portfolio/lib/contexts/language-context";
import type { LightboxImage } from "./image-lightbox";

const copy = {
  en: {
    title: "Image viewer",
    image: "Image",
    previous: "Previous image",
    next: "Next image",
    error: "This image could not be loaded.",
  },
  "zh-TW": {
    title: "圖片檢視器",
    image: "圖片",
    previous: "上一張圖片",
    next: "下一張圖片",
    error: "無法載入這張圖片。",
  },
};

const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;

export default function LightboxViewer({
  images,
  index: initialIndex,
  language,
  onClose,
  onRestoreFocus,
}: {
  images: LightboxImage[];
  index: number;
  language: Language;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  const text = copy[language];
  const [index, setIndex] = useState(initialIndex);
  const image = images[index];
  const multiple = images.length > 1;

  function move(delta: number) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  // Warm the neighbours so the first arrow key or swipe lands without a wait.
  useEffect(() => {
    if (!multiple) return;
    for (const delta of [-1, 1]) {
      new window.Image().src =
        images[(index + delta + images.length) % images.length].src;
    }
  }, [images, index, multiple]);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-[70] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
          onKeyDown={(event) => {
            if (!multiple) return;
            if (event.key === "ArrowLeft") move(-1);
            else if (event.key === "ArrowRight") move(1);
          }}
        >
          <Dialog.Title className="sr-only">{text.title}</Dialog.Title>

          <Stage
            image={image}
            multiple={multiple}
            errorText={text.error}
            move={move}
            onClose={onClose}
          />

          {(image.caption || multiple) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {image.caption && (
                <p className="max-w-3xl text-center text-sm leading-relaxed text-white/70">
                  {image.caption}
                </p>
              )}
              {multiple && (
                <nav
                  aria-label={text.title}
                  className="pointer-events-auto flex items-center rounded-full bg-card/50 p-0.5"
                >
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
                    aria-label={text.previous}
                    onClick={() => move(-1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span
                    className="select-none px-1 font-heading text-xs tabular-nums tracking-widest text-white/80"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {text.image}{" "}
                    <span
                      className="inline-block text-center"
                      // Fixed width sized to the widest possible label
                      // ("NN/NN"), so the capsule never resizes mid-browse
                      // even if the font has no tabular figures.
                      style={{
                        minWidth: `${String(images.length).length * 2 + 2}ch`,
                      }}
                    >
                      {index + 1}/{images.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
                    aria-label={text.next}
                    onClick={() => move(1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * The image area. One pointer pipeline covers every gesture:
 * tap on the white space closes, tap on the image twice zooms into the
 * tapped spot, drag pans while zoomed (swipes between images otherwise),
 * and two fingers pinch. Scroll zooms at the cursor, like the local graph.
 */
function Stage({
  image,
  multiple,
  errorText,
  move,
  onClose,
}: {
  image: LightboxImage;
  multiple: boolean;
  errorText: string;
  move: (delta: number) => void;
  onClose: () => void;
}) {
  // Loaded state is keyed by src: navigating back to a seen image is instant,
  // a new one fades in from blank.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    x: 0, // first pointer's press origin
    y: 0,
    lastX: 0, // first pointer's latest position
    lastY: 0,
    pinch: 0, // previous two-finger distance; 0 while not pinching
    pinched: false, // a second finger joined at some point this gesture
    onStage: false, // the press began on the white space, not the image
    moved: false,
    tap: { t: 0, x: 0, y: 0 }, // last tap, for double-tap detection
  });

  // The zoom transform lives outside React state and is written straight to
  // the <img>, so zooming never waits on a re-render. `goal` is where scroll
  // and double-tap are heading; `view` is what is on screen right now.
  const view = useRef({ scale: 1, x: 0, y: 0 });
  const goal = useRef({ scale: 1, x: 0, y: 0 });
  const raf = useRef(0);

  // Keep the image edges from leaving the viewport while panning.
  const boundOffset = useCallback((x: number, y: number, scale: number) => {
    const w = viewport.current?.clientWidth ?? 0;
    const h = viewport.current?.clientHeight ?? 0;
    const maxX = Math.max(0, ((img.current?.clientWidth ?? w) * scale - w) / 2);
    const maxY = Math.max(
      0,
      ((img.current?.clientHeight ?? h) * scale - h) / 2,
    );
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  function paint() {
    const el = img.current;
    if (!el) return;
    const v = view.current;
    el.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.scale})`;
    el.style.cursor = v.scale > 1 ? "grab" : "zoom-in";
  }

  // Track the goal 1:1 — pinch and pan must follow the fingers exactly.
  function snap(next: { scale: number; x: number; y: number }) {
    cancelAnimationFrame(raf.current);
    view.current = next;
    goal.current = next;
    paint();
  }

  // Ease the screen toward the goal over a few frames, the way the local
  // graph eases its d3 zoom transitions — chunky wheel steps and the
  // double-tap jump become one continuous motion.
  function ease() {
    cancelAnimationFrame(raf.current);
    let last = performance.now();
    const step = (now: number) => {
      const v = view.current;
      const t = goal.current;
      const a = 1 - Math.exp(-(now - last) / 70);
      last = now;
      const next = {
        scale: v.scale + (t.scale - v.scale) * a,
        ...boundOffset(v.x + (t.x - v.x) * a, v.y + (t.y - v.y) * a, v.scale),
      };
      view.current = next;
      if (
        Math.abs(t.scale - next.scale) < 0.005 &&
        Math.hypot(t.x - next.x, t.y - next.y) < 0.75
      ) {
        view.current = { ...t };
        paint();
        return; // settled
      }
      paint();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  // The transform that keeps the stage point under (clientX, clientY) pinned
  // to the same point of the image at the new scale. `smooth` eases toward
  // the result; otherwise it lands there at once.
  function zoomAbout(
    base: { scale: number; x: number; y: number },
    scale: number,
    clientX: number,
    clientY: number,
    smooth: boolean,
  ) {
    const rect = viewport.current?.getBoundingClientRect();
    const ax = rect ? clientX - (rect.left + rect.width / 2) : 0;
    const ay = rect ? clientY - (rect.top + rect.height / 2) : 0;
    const s = Math.min(MAX_ZOOM, Math.max(1, scale));
    const next =
      s === 1
        ? { scale: 1, x: 0, y: 0 }
        : {
            scale: s,
            ...boundOffset(
              ax - ((ax - base.x) / base.scale) * s,
              ay - ((ay - base.y) / base.scale) * s,
              s,
            ),
          };
    goal.current = next;
    if (smooth) ease();
    else snap(next);
  }

  // Scroll zooms at the cursor, like the local graph. Attached natively so
  // the browser's own wheel handling can be prevented.
  useEffect(() => {
    const stage = viewport.current;
    if (!stage) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      zoomAbout(
        goal.current,
        goal.current.scale * Math.exp(-event.deltaY * 0.002),
        event.clientX,
        event.clientY,
        true,
      );
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zoomAbout only
    // reads refs and stable callbacks, so the first render's copy is safe.
  }, []);

  // Navigating always starts the next image at fit size, and a closed
  // viewer must not keep easing after unmount.
  useEffect(() => {
    snap({ scale: 1, x: 0, y: 0 });
    return () => cancelAnimationFrame(raf.current);
  }, [image.src]);

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || pointers.current.size >= 2) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointers.current.size === 1) {
      const g = gesture.current;
      g.x = g.lastX = event.clientX;
      g.y = g.lastY = event.clientY;
      g.pinch = 0;
      g.pinched = false;
      g.moved = false;
      g.onStage = event.target === event.currentTarget;
    } else {
      // A second finger is never a tap or a swipe.
      gesture.current.moved = true;
      gesture.current.pinched = true;
      gesture.current.pinch = pinchDistance();
    }
  }

  function pinchDistance() {
    const [a, b] = Array.from(pointers.current.values());
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  function track(event: PointerEvent<HTMLDivElement>) {
    const p = pointers.current.get(event.pointerId);
    if (!p) return;
    p.x = event.clientX;
    p.y = event.clientY;
    const g = gesture.current;
    if (pointers.current.size >= 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.pinch && distance) {
        zoomAbout(
          view.current,
          (view.current.scale * distance) / g.pinch,
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
          false,
        );
      }
      g.pinch = distance;
    } else {
      const dx = event.clientX - g.lastX;
      const dy = event.clientY - g.lastY;
      g.lastX = event.clientX;
      g.lastY = event.clientY;
      if (view.current.scale > 1) {
        g.moved = true;
        snap({
          scale: view.current.scale,
          ...boundOffset(
            view.current.x + dx,
            view.current.y + dy,
            view.current.scale,
          ),
        });
      } else if (Math.hypot(event.clientX - g.x, event.clientY - g.y) > 10) {
        g.moved = true;
      }
    }
  }

  function up(event: PointerEvent<HTMLDivElement>) {
    const active = pointers.current.delete(event.pointerId);
    if (pointers.current.size === 1) {
      // The pinch is over; resume tracking with the finger that remains.
      const [p] = pointers.current.values();
      const g = gesture.current;
      g.lastX = p.x;
      g.lastY = p.y;
      g.pinch = 0;
      return;
    }
    if (!active || event.button !== 0) return;
    const g = gesture.current;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (!g.moved && Math.hypot(dx, dy) < 6) {
      const now = performance.now();
      const t = g.tap;
      if (
        now - t.t < 300 &&
        Math.hypot(event.clientX - t.x, event.clientY - t.y) < 40
      ) {
        g.tap.t = 0;
        zoomAbout(
          goal.current,
          view.current.scale > 1.05 ? 1 : TAP_ZOOM,
          event.clientX,
          event.clientY,
          true,
        );
      } else {
        g.tap = { t: now, x: event.clientX, y: event.clientY };
        // A plain tap on the white space closes; on the image it only arms
        // the double-tap above.
        if (g.onStage) onClose();
      }
    } else if (
      multiple &&
      view.current.scale < 1.01 &&
      !g.pinched &&
      Math.abs(dx) > 60 &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      move(dx < 0 ? 1 : -1);
    }
  }

  return (
    <div
      ref={viewport}
      className="absolute inset-0 flex touch-none select-none items-center justify-center p-4 md:p-10"
      onPointerDown={down}
      onPointerMove={track}
      onPointerUp={up}
      onPointerCancel={(event) => {
        // A cancelled gesture is never a tap — don't let it close anything.
        pointers.current.delete(event.pointerId);
        gesture.current.moved = true;
        gesture.current.pinch = 0;
      }}
    >
      {failedSrc === image.src ? (
        <p className="text-sm text-white/60">{errorText}</p>
      ) : (
        <>
          {loadedSrc !== image.src && (
            <div
              className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-white/80"
              aria-hidden="true"
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={img}
            src={image.src}
            alt={image.alt}
            draggable={false}
            className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
              loadedSrc === image.src ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoadedSrc(image.src)}
            onError={() => setFailedSrc(image.src)}
          />
        </>
      )}
    </div>
  );
}
