"use client";

import { useState, useTransition } from "react";
import { SmoothLabel } from "@/components/smooth-label";
import type { FormState } from "@/components/types";

/**
 * The one destructive button: a red pill. The first tap arms it (it fills in
 * and asks again, easing to the new width); a second tap within 3s runs it.
 */
export function ConfirmButton({
  label,
  confirm = `Tap again to ${label.toLowerCase()}`,
  busy = "Working…",
  run,
  onDone,
}: {
  label: string;
  confirm?: string;
  busy?: string;
  run: () => Promise<FormState>;
  onDone?: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={`inline-flex h-10 items-center justify-center rounded-full border border-negative px-5 text-sm font-medium transition-colors disabled:opacity-40 ${
          armed || pending
            ? "bg-negative text-background"
            : "text-negative hover:bg-negative hover:text-background"
        }`}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            setTimeout(() => setArmed(false), 3000);
            return;
          }
          start(async () => {
            const res = await run();
            setError(res.error);
            setArmed(false);
            if (!res.error) onDone?.();
          });
        }}
      >
        <SmoothLabel text={pending ? busy : armed ? confirm : label} />
      </button>
      {error && <span className="text-xs text-negative">{error}</span>}
    </span>
  );
}
