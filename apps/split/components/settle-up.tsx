"use client";

import { useState, useTransition } from "react";
import { Money } from "@/components/money";
import { PayTo } from "@/components/pay-to";
import { SmoothLabel } from "@/components/smooth-label";
import type { ExpenseRow, LedgerContext, Transfer } from "@/components/types";

type Row = {
  key: string;
  from: string;
  to: string;
  amount: number;
  /** Set on recorded payments: the entry to delete when unticked. */
  paymentId?: string;
};

/**
 * The fewest transfers that square everyone, as a checklist. Ticking one
 * records a payment, which drops it to the bottom as done; unticking deletes
 * that payment and the debt comes back.
 */
export function SettleUp({
  ctx,
  transfers,
  expenses,
}: {
  ctx: LedgerContext;
  transfers: Transfer[];
  expenses: ExpenseRow[];
}) {
  const open: Row[] = transfers.map((t) => ({
    key: `${t.from}-${t.to}`,
    ...t,
  }));
  const paid: Row[] = expenses
    .filter((e) => e.kind === "settlement" && e.shares[0])
    .map((e) => ({
      key: e.id,
      from: e.payerId,
      to: e.shares[0].memberId,
      amount: e.amount,
      paymentId: e.id,
    }));

  return (
    <section className="card">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="section-label">Settle up</h2>
        {open.length + paid.length > 0 && (
          <span className="text-xs text-secondary">
            {open.length} to go{paid.length > 0 && ` · ${paid.length} paid`}
          </span>
        )}
      </div>

      {open.length === 0 && (
        <p className="flex items-center gap-2 py-3 text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          Everyone is square.
        </p>
      )}
      {open.length + paid.length > 0 && (
        <ul>
          {[...open, ...paid].map((r) => (
            <TransferRow key={r.key} ctx={ctx} row={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TransferRow({ ctx, row: r }: { ctx: LedgerContext; row: Row }) {
  const done = !!r.paymentId;
  const methods = ctx.members.find((m) => m.id === r.to)?.payMethods ?? [];
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  // While saving, show the box in the state it's about to be in.
  const ticked = done !== pending;

  // First tap arms the box; a second tap within 3s commits.
  const toggle = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    start(async () => {
      const res = done
        ? await ctx.actions.deleteExpense(r.paymentId!)
        : await ctx.actions.recordPayment(r.from, r.to, r.amount);
      setError(res.error);
      setArmed(false);
    });
  };

  return (
    <li className="border-b last:border-b-0">
      <div
        className={`flex items-center gap-3 py-3 transition-opacity ${done && !armed ? "opacity-45" : ""}`}
      >
        {ctx.role === "admin" && (
          <button
            type="button"
            role="checkbox"
            aria-checked={ticked}
            aria-label={
              armed
                ? "Tap again to confirm"
                : done
                  ? "Mark as not paid"
                  : `Mark ${ctx.nameOf(r.from)}'s payment as paid`
            }
            disabled={pending}
            onClick={toggle}
            // A 16px circle that grows into a capsule as tall as the names
            // (24px) while asking to confirm, pushing them along with it.
            className={`inline-flex min-w-4 shrink-0 items-center justify-center rounded-full border px-[3px] text-[11px] font-medium uppercase leading-none tracking-wider transition-[height,color,background-color,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
              armed ? "h-6 px-1.5" : "h-4"
            } ${
              armed
                ? done
                  ? "border-negative text-negative"
                  : "border-positive text-positive"
                : ticked
                  ? "border-positive bg-positive text-background"
                  : "border-secondary hover:border-primary"
            }`}
          >
            {ticked && !armed && (
              <svg viewBox="0 0 12 12" className="h-2 w-2" aria-hidden>
                <path
                  d="M2 6.3 4.8 9 10 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            )}
            <SmoothLabel
              text={armed ? (done ? "Unpaid?" : "Paid?") : ""}
              className="px-1"
            />
          </button>
        )}

        <button
          type="button"
          className="flex min-w-0 flex-1 items-baseline gap-3 text-left"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="min-w-0 flex-1 truncate">
            {ctx.nameOf(r.from)}
            <span className="mx-2 text-secondary">→</span>
            {ctx.nameOf(r.to)}
          </span>
          <Money
            value={r.amount}
            currency={ctx.currency}
            className={done ? "line-through decoration-secondary" : ""}
          />
        </button>
      </div>

      {open && (
        <div className={`pb-4 ${ctx.role === "admin" ? "pl-7" : ""}`}>
          {methods.length ? (
            <PayTo methods={methods} />
          ) : (
            <p className="text-sm text-secondary">
              {ctx.nameOf(r.to)} has no transfer details yet.
            </p>
          )}
        </div>
      )}
      {error && <p className="pb-3 text-xs text-secondary">{error}</p>}
    </li>
  );
}
