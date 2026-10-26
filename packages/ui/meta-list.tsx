import type { ReactNode } from "react";

export interface MetaItem {
  label: string;
  value: ReactNode;
}

// Ruled label/value rows for project, gallery and blog headers. Each label
// sits above its value, so every value shares the left edge of the title and
// body text around it.
//
// From `sm` up the rows balance themselves: each is a flex item sized to its
// content but never narrower than half the list, and free to grow. Two short
// neighbours (Year, Role) therefore sit side by side at exactly 50% each, so
// the second column's labels line up; anything too long to fit in half
// (Overview, a tags list) wraps onto its own line; and a short row left
// without a partner grows to the full width rather than leaving a hole.
export function MetaList({
  items,
  className = "",
}: {
  // Falsy entries are skipped, so callers can write `field && { ... }`.
  items: (MetaItem | false | null | undefined | "" | 0)[];
  className?: string;
}) {
  const rows = items.filter((item): item is MetaItem => Boolean(item));
  if (rows.length === 0) return null;

  return (
    <dl className={`flex flex-wrap border-b border-border ${className}`}>
      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="grow min-w-full sm:min-w-[50%] sm:pr-6 py-3 border-t border-border"
        >
          <dt className="font-heading uppercase text-xs tracking-wider text-secondary mb-1">
            {label}
          </dt>
          <dd className="font-body text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
