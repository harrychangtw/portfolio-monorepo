"use client";

import { useEffect, useRef } from "react";

/**
 * A native <dialog>: a bottom sheet on phones, a centered panel on desktop.
 * Escape and backdrop clicks close it.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pb-7">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-heading text-xl">{title}</h2>
          <button type="button" className="link text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
