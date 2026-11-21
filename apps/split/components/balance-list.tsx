"use client";

import { useState } from "react";
import { amount } from "@/lib/money";
import { Money } from "@/components/money";
import { PayTo } from "@/components/pay-to";
import type { Balance, LedgerContext } from "@/components/types";

export function BalanceList({
  ctx,
  balances,
  spent,
}: {
  ctx: LedgerContext;
  balances: Balance[];
  /** Total spending in base currency (payments between people excluded). */
  spent: number;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="card">
      <h2 className="section-label mb-2">Balances</h2>

      <ul>
        {balances.map((b) => {
          const isOpen = open === b.member.id;
          return (
            <li key={b.member.id} className="border-b last:border-b-0">
              <button
                className="group flex w-full items-center gap-3 py-3 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : b.member.id)}
              >
                {/* Chevron (8px) + gap (10px) = 18px, the indent the breakdown below aligns to. */}
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <svg
                    viewBox="0 0 8 12"
                    aria-hidden
                    className={`h-2.5 w-2 shrink-0 text-primary transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  >
                    <path
                      d="M1.5 1.5 6 6l-4.5 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                  <span className="truncate">{b.member.name}</span>
                </span>
                <Money
                  sign
                  roll
                  value={b.net}
                  currency={ctx.currency}
                  className={
                    b.net > 0
                      ? "text-positive"
                      : b.net < 0
                        ? "text-negative"
                        : "text-secondary"
                  }
                />
              </button>

              {isOpen && <Breakdown ctx={ctx} balance={b} />}
            </li>
          );
        })}
      </ul>
      <div className="mt-1 flex items-baseline justify-between gap-3 border-t pt-3">
        <span className="pl-[18px] text-secondary">Total spent</span>
        <Money roll value={spent} currency={ctx.currency} />
      </div>
    </section>
  );
}

function Breakdown({
  ctx,
  balance: b,
}: {
  ctx: LedgerContext;
  balance: Balance;
}) {
  const fmt = (n: number) => (n ? amount(n, ctx.currency) : "—");
  return (
    <div className="pb-5 pl-[18px] text-sm">
      <table className="num w-full">
        <thead>
          <tr className="text-xs text-secondary">
            <th className="py-1 text-left font-normal">
              Entry · {ctx.currency}
            </th>
            <th className="py-1 text-right font-normal">Paid</th>
            <th className="py-1 text-right font-normal">Share</th>
          </tr>
        </thead>
        <tbody>
          {b.lines.map((l) => (
            <tr key={l.expense.id}>
              <td className="max-w-0 truncate py-1 pr-3">
                {l.expense.kind === "settlement" ? (
                  <span className="text-secondary">
                    {l.paid
                      ? `Paid ${ctx.nameOf(l.expense.shares[0]?.memberId)}`
                      : `From ${ctx.nameOf(l.expense.payerId)}`}
                  </span>
                ) : (
                  l.expense.title
                )}
              </td>
              <td className="w-24 py-1 text-right">{fmt(l.paid)}</td>
              <td className="w-24 py-1 text-right">{fmt(l.share)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t">
            <td className="pt-2 text-secondary">Total</td>
            <td className="pt-2 text-right">{amount(b.paid, ctx.currency)}</td>
            <td className="pt-2 text-right">{amount(b.share, ctx.currency)}</td>
          </tr>
        </tfoot>
      </table>

      {b.member.payMethods.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-secondary">
            Transfer details
          </p>
          <PayTo methods={b.member.payMethods} className="mt-2" />
        </div>
      )}
    </div>
  );
}
