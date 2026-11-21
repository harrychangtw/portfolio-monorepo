"use client";

import { useState } from "react";
import { convert } from "@/lib/money";
import { Money } from "@/components/money";
import { Sheet } from "@/components/sheet";
import { ExpenseForm } from "@/components/expense-form";
import type { ExpenseRow, LedgerContext } from "@/components/types";

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function EntryList({
  ctx,
  expenses,
}: {
  ctx: LedgerContext;
  expenses: ExpenseRow[];
}) {
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const canEdit = ctx.role === "admin";

  // Already sorted newest first; group consecutive rows by day.
  const days: { date: string; rows: ExpenseRow[] }[] = [];
  for (const e of expenses) {
    if (days.at(-1)?.date === e.date) days.at(-1)!.rows.push(e);
    else days.push({ date: e.date, rows: [e] });
  }

  return (
    <section className="card">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="section-label">Entries</h2>
        <span className="text-xs text-secondary">{expenses.length}</span>
      </div>

      {expenses.length === 0 && (
        <p className="py-3 text-secondary">Nothing here yet.</p>
      )}

      {days.map((d) => (
        // Each day opens with its date and a rule running out to the right.
        <div key={d.date} className="pt-4 first:pt-1">
          <p className="num flex items-center gap-3 pb-1 text-xs text-secondary">
            {dayLabel(d.date)}
            <span className="h-px flex-1 bg-border" aria-hidden />
          </p>
          <ul>
            {d.rows.map((e) => (
              <li key={e.id}>
                <button
                  className="w-full py-2 text-left disabled:cursor-default"
                  disabled={!canEdit}
                  onClick={() => setEditing(e)}
                >
                  <Entry ctx={ctx} e={e} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.kind === "settlement" ? "Payment" : "Edit expense"}
      >
        {editing && (
          <ExpenseForm
            ctx={ctx}
            expenses={expenses}
            editing={editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </section>
  );
}

function Entry({ ctx, e }: { ctx: LedgerContext; e: ExpenseRow }) {
  if (e.kind === "settlement") {
    return (
      <div className="flex items-baseline justify-between gap-4 text-secondary">
        <span>
          {ctx.nameOf(e.payerId)} paid {ctx.nameOf(e.shares[0]?.memberId)}
        </span>
        <Money value={e.amount} currency={e.currency} />
      </div>
    );
  }

  const foreign = e.currency !== ctx.currency;
  const who =
    e.shares.length === ctx.members.length && e.splitMode === "even"
      ? "everyone"
      : e.shares.length === 1
        ? ctx.nameOf(e.shares[0].memberId)
        : `${e.shares.length} people`;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 truncate">{e.title}</span>
        <Money
          value={convert(e.amount, e.currency, ctx.currency, e.rate)}
          currency={ctx.currency}
          className="shrink-0"
        />
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-4 text-sm text-secondary">
        <span className="min-w-0 truncate">
          {ctx.nameOf(e.payerId)} paid ·{" "}
          {e.splitMode === "custom" ? "custom split, " : ""}
          {who}
        </span>
        {foreign && (
          <Money value={e.amount} currency={e.currency} className="shrink-0" />
        )}
      </div>
    </>
  );
}
