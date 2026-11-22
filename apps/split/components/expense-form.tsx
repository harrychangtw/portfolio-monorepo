"use client";

import { useActionState, useEffect, useState } from "react";
import {
  allocate,
  CURRENCIES,
  convert,
  format,
  fromMinor,
  toMinor,
} from "@/lib/money";
import { Select } from "@/components/select";
import { ConfirmButton } from "@/components/confirm-button";
import { SmoothLabel } from "@/components/smooth-label";
import { useDefaultName } from "@/components/use-default-name";
import type { ExpenseRow, FormState, LedgerContext } from "@/components/types";

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export function ExpenseForm({
  ctx,
  expenses,
  editing,
  onDone,
}: {
  ctx: LedgerContext;
  expenses: ExpenseRow[];
  editing?: ExpenseRow;
  onDone: () => void;
}) {
  if (editing?.kind === "settlement") {
    return <PaymentDetails ctx={ctx} payment={editing} onDone={onDone} />;
  }
  return (
    <ExpenseFields
      ctx={ctx}
      expenses={expenses}
      editing={editing}
      onDone={onDone}
    />
  );
}

/** Starting locks when editing: excluded people at 0; custom splits pin everyone. */
function initialLocks(
  ctx: LedgerContext,
  e?: ExpenseRow,
): Record<string, string> {
  if (!e) return {};
  const share = new Map(e.shares.map((s) => [s.memberId, s.amount]));
  const locks: Record<string, string> = {};
  for (const m of ctx.members) {
    if (!share.has(m.id)) locks[m.id] = "0";
    else if (e.splitMode === "custom")
      locks[m.id] = fromMinor(share.get(m.id)!, e.currency);
  }
  return locks;
}

function ExpenseFields({
  ctx,
  expenses,
  editing: e,
  onDone,
}: {
  ctx: LedgerContext;
  expenses: ExpenseRow[];
  editing?: ExpenseRow;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    ctx.actions.saveExpense,
    {},
  );
  useEffect(() => {
    if (state.done) onDone();
  }, [state.done, onDone]);

  const fallback = useDefaultName();
  const [currency, setCurrency] = useState(e?.currency ?? ctx.currency);
  const [amount, setAmount] = useState(
    e ? fromMinor(e.amount, e.currency) : "",
  );
  // Default a foreign currency's rate to the last one used in this ledger.
  const lastRate = (c: string) => expenses.find((x) => x.currency === c)?.rate;
  const [rate, setRate] = useState(
    e && e.currency !== ctx.currency ? String(e.rate) : "",
  );
  const [payer, setPayer] = useState(e?.payerId ?? ctx.members[0]?.id);
  // People whose share was typed in. Everyone else splits what's left evenly.
  const [locks, setLocks] = useState<Record<string, string>>(() =>
    initialLocks(ctx, e),
  );

  const total = toMinor(amount, currency) ?? 0;
  const foreign = currency !== ctx.currency;
  const rateNum = Number(rate);

  const lockedMinor = (id: string) => toMinor(locks[id] ?? "", currency) ?? 0;
  const free = ctx.members.filter((m) => locks[m.id] === undefined);
  const lockedSum = ctx.members.reduce(
    (a, m) => a + (locks[m.id] !== undefined ? lockedMinor(m.id) : 0),
    0,
  );
  const remainder = Math.max(0, total - lockedSum);
  const auto = new Map(
    allocate(
      remainder,
      free.map(() => 1),
    ).map((v, i) => [free[i].id, v]),
  );
  const shareOf = (id: string) =>
    locks[id] !== undefined ? lockedMinor(id) : (auto.get(id) ?? 0);
  const sum = ctx.members.reduce((a, m) => a + shareOf(m.id), 0);
  const diff = total - sum;
  // Bumped on a blocked submit: re-keys the split to replay the shake.
  const [nudge, setNudge] = useState(0);
  const splitMode = Object.values(locks).every(
    (v) => (toMinor(v, currency) ?? 0) === 0,
  )
    ? "even"
    : "custom";

  const setLock = (id: string, value: string) => {
    const next = { ...locks };
    if (value.trim() === "") delete next[id];
    else next[id] = value;
    setLocks(next);
  };

  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (total > 0 && diff !== 0) {
          ev.preventDefault();
          setNudge((n) => n + 1);
        }
      }}
    >
      {e && <input type="hidden" name="id" value={e.id} />}
      <input type="hidden" name="splitMode" value={splitMode} />
      <input type="hidden" name="fallbackName" value={fallback} />
      {ctx.members.map((m) => (
        <input
          key={m.id}
          type="hidden"
          name={`share_${m.id}`}
          value={fromMinor(shareOf(m.id), currency)}
        />
      ))}

      {/* The entry's name is the header; blank saves as the placeholder.
          The date sits quietly beside it, since most entries are added same-day. */}
      <div className="flex items-center gap-4">
        <input
          name="title"
          defaultValue={e?.title}
          placeholder={fallback}
          aria-label="Entry name"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-heading text-lg text-primary placeholder:text-secondary focus:outline-none focus:ring-0"
        />
        <DateText defaultValue={e?.date ?? today()} />
      </div>
      <span className="field-row mt-3">
        <input
          name="amount"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
          inputMode="decimal"
          className="field num h-16 font-heading text-4xl leading-[4rem]"
          placeholder="0"
          aria-label="Amount"
          autoComplete="off"
          required
        />
        <Select
          inline
          name="currency"
          aria-label="Currency"
          value={currency}
          onChange={(ev) => {
            const c = ev.target.value;
            setCurrency(c);
            if (c !== ctx.currency && !rate) setRate(String(lastRate(c) ?? ""));
          }}
        >
          {[ctx.currency, ...CURRENCIES.filter((c) => c !== ctx.currency)].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </Select>
      </span>

      {/* Everything else waits until there's an amount to work with. */}
      <div
        inert={!(total > 0 || e)}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          total > 0 || e
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-7 pt-7">
            {foreign && (
              <label className="block">
                <span className="field-label">Rate</span>
                <span className="field-row">
                  <span className="shrink-0 text-sm text-secondary">
                    1 {currency} =
                  </span>
                  <input
                    name="rate"
                    value={rate}
                    onChange={(ev) => setRate(ev.target.value)}
                    inputMode="decimal"
                    className="field num"
                    placeholder="0.21"
                    required={foreign}
                  />
                  <span className="shrink-0 text-sm text-secondary">
                    {ctx.currency}
                  </span>
                </span>
                {total > 0 && rateNum > 0 && (
                  <span className="num mt-1 block text-xs text-secondary">
                    ≈{" "}
                    {format(
                      convert(total, currency, ctx.currency, rateNum),
                      ctx.currency,
                    )}
                  </span>
                )}
              </label>
            )}

            <fieldset>
              <legend className="field-label">Paid by</legend>
              <div className="flex flex-wrap gap-2 pt-1">
                {ctx.members.map((m) => (
                  <label
                    key={m.id}
                    className="chip cursor-pointer"
                    data-on={payer === m.id}
                  >
                    <input
                      type="radio"
                      name="payerId"
                      value={m.id}
                      checked={payer === m.id}
                      onChange={() => setPayer(m.id)}
                      className="sr-only"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset
              key={nudge}
              className={nudge > 0 && diff !== 0 ? "shake" : ""}
            >
              <div className="mb-1 flex items-baseline justify-between">
                <legend className="field-label mb-0">Split</legend>
                {Object.keys(locks).length > 0 && (
                  <button
                    type="button"
                    className="link text-xs"
                    onClick={() => setLocks({})}
                  >
                    Split evenly
                  </button>
                )}
              </div>
              <ul>
                {ctx.members.map((m) => {
                  const locked = locks[m.id] !== undefined;
                  const out = locked && lockedMinor(m.id) === 0;
                  return (
                    <li key={m.id} className="flex items-center gap-4 border-b">
                      <span
                        className={`min-w-0 flex-1 truncate text-sm transition-colors ${out ? "text-secondary line-through decoration-border" : ""}`}
                      >
                        {m.name}
                      </span>
                      <input
                        value={locks[m.id] ?? ""}
                        onChange={(ev) => setLock(m.id, ev.target.value)}
                        placeholder={fromMinor(auto.get(m.id) ?? 0, currency)}
                        inputMode="decimal"
                        aria-label={`${m.name}'s share`}
                        className="field num w-32 border-b-0 text-right"
                        autoComplete="off"
                      />
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <div className="flex items-center gap-3">
              {/* The button doubles as the check: it says what's off, and
                  pressing it then shakes the split instead of saving. */}
              <button
                className={
                  diff === 0
                    ? "button"
                    : "inline-flex h-10 items-center justify-center rounded-full border border-negative px-5 text-sm font-medium text-negative"
                }
                disabled={pending || total <= 0}
              >
                <SmoothLabel
                  text={
                    pending
                      ? "Saving…"
                      : diff > 0
                        ? `${format(diff, currency)} short`
                        : diff < 0
                          ? `${format(-diff, currency)} over`
                          : e
                            ? "Save"
                            : "Add entry"
                  }
                />
              </button>
              {/* onDone clears the composer, or closes the edit sheet. */}
              <button type="button" onClick={onDone} className="button-ghost">
                Cancel
              </button>
              {e && (
                <ConfirmButton
                  label="Delete"
                  busy="Deleting…"
                  run={() => ctx.actions.deleteExpense(e.id)}
                  onDone={onDone}
                />
              )}
            </div>
            {state.error && (
              <p className="text-sm text-secondary">{state.error}</p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function PaymentDetails({
  ctx,
  payment: p,
  onDone,
}: {
  ctx: LedgerContext;
  payment: ExpenseRow;
  onDone: () => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-lg">
        {ctx.nameOf(p.payerId)}
        <span className="mx-2 text-secondary">→</span>
        {ctx.nameOf(p.shares[0]?.memberId)}
        <span className="num float-right">{format(p.amount, p.currency)}</span>
      </p>
      <p className="text-sm text-secondary">
        Recorded {p.date}. Deleting it puts the debt back into Settle up.
      </p>
      <ConfirmButton
        label="Delete payment"
        busy="Deleting…"
        run={() => ctx.actions.deleteExpense(p.id)}
        onDone={onDone}
      />
    </div>
  );
}

/**
 * The entry's date as plain text ("Today", "Nov 21"). A transparent native
 * date input covers it, so a tap opens the system picker but no browser gets
 * to draw its own calendar icon.
 */
function DateText({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const shown =
    value === today()
      ? "Today"
      : new Date(`${value}T00:00:00Z`).toLocaleDateString("en", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });

  return (
    // overflow-hidden: iOS won't shrink a date input below its own minimum
    // width, so the invisible overlay stuck out past the card's right edge
    // and widened the whole page.
    <label className="relative shrink-0 cursor-pointer overflow-hidden font-heading text-lg text-secondary transition-colors hover:text-primary focus-within:text-primary">
      {shown}
      <input
        type="date"
        name="date"
        value={value}
        onChange={(ev) => ev.target.value && setValue(ev.target.value)}
        onClick={(ev) => ev.currentTarget.showPicker?.()}
        aria-label="Date"
        required
        className="absolute inset-0 h-full w-full min-w-0 cursor-pointer appearance-none opacity-0"
      />
    </label>
  );
}
