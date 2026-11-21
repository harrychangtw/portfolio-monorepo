"use client";

import { useActionState, useEffect, useState } from "react";
import { PayTo } from "@/components/pay-to";
import { METHOD_TYPES, specFor, type PayMethod } from "@/lib/pay-methods";
import { Select } from "@/components/select";
import { ConfirmButton } from "@/components/confirm-button";
import type { FormState, LedgerContext, MemberRow } from "@/components/types";

/**
 * Names and transfer details are set once, so they live behind a toggle
 * at the bottom of the page instead of crowding the balances.
 */
export function PeopleCard({ ctx }: { ctx: LedgerContext }) {
  // A new ledger starts with nobody in it, so open straight to adding people.
  const [open, setOpen] = useState(ctx.members.length < 2);
  const [editing, setEditing] = useState<string | null>(null);
  const missing = ctx.members.filter((m) => !m.payMethods.length).length;

  return (
    <section className="card">
      <button
        className="flex w-full items-baseline justify-between"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <h2 className="section-label">People</h2>
        <span className="text-xs text-secondary">
          {ctx.members.length === 0
            ? "Add everyone splitting"
            : missing
              ? `${missing} without transfer details`
              : `${ctx.members.length} people`}
          <span
            className={`ml-2 inline-block transition-transform ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </span>
      </button>

      {open && (
        <ul className="mt-2">
          {ctx.members.map((m) => (
            <li key={m.id} className="border-b last:border-b-0">
              {editing === m.id ? (
                <MemberForm
                  ctx={ctx}
                  member={m}
                  onDone={() => setEditing(null)}
                />
              ) : (
                <div className="py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <p>{m.name}</p>
                    {ctx.role !== "viewer" && (
                      <button
                        className="link shrink-0 text-xs"
                        onClick={() => setEditing(m.id)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {m.payMethods.length ? (
                    <PayTo methods={m.payMethods} className="mt-2" />
                  ) : (
                    <p className="mt-1 text-sm text-secondary">
                      No transfer details yet.
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
          {ctx.role === "admin" && (
            <li>
              <AddMemberForm ctx={ctx} />
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function MemberForm({
  ctx,
  member,
  onDone,
}: {
  ctx: LedgerContext;
  member: MemberRow;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    ctx.actions.saveMember,
    {},
  );
  useEffect(() => {
    if (state.done) onDone();
  }, [state.done, onDone]);

  return (
    <form action={action} className="space-y-5 py-4">
      <input type="hidden" name="id" value={member.id} />
      {ctx.role === "admin" ? (
        <label className="block">
          <span className="field-label">Name</span>
          <input
            name="name"
            defaultValue={member.name}
            className="field"
            required
          />
        </label>
      ) : (
        <p>{member.name}</p>
      )}
      <MethodsEditor initial={member.payMethods} />
      <div className="flex items-start gap-3">
        <button className="button" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" className="button-ghost" onClick={onDone}>
          Cancel
        </button>
        {ctx.role === "admin" && (
          <span className="ml-auto">
            <ConfirmButton
              label="Remove"
              confirm="Tap again to remove"
              busy="Removing…"
              run={() => ctx.actions.removeMember(member.id)}
              onDone={onDone}
            />
          </span>
        )}
      </div>
      {state.error && <p className="text-sm text-secondary">{state.error}</p>}
    </form>
  );
}

function AddMemberForm({ ctx }: { ctx: LedgerContext }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    ctx.actions.addMember,
    {},
  );
  return (
    // A new `done` stamp remounts the form, clearing the input.
    <form key={state.done ?? 0} action={action} className="pt-2">
      <span className="field-row">
        <input
          name="name"
          className="field"
          placeholder={ctx.members.length === 0 ? "You" : "Add a person"}
          autoFocus={ctx.members.length < 2}
          autoComplete="off"
          required
        />
        <button className="link shrink-0 text-xs" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
      </span>
      {state.error && (
        <p className="mt-1 text-sm text-secondary">{state.error}</p>
      )}
    </form>
  );
}

const EMPTY: PayMethod = { type: "Bank", id: "", account: "" };

// Nothing worth saving yet (no qualifier or account).
const isEmpty = (m: PayMethod) => !m.id && !m.account;
// Untouched: still the default blank row. A row whose type was changed counts
// as touched, so picking PayPal on the blank row sticks instead of resetting.
const isUntouched = (m: PayMethod) => isEmpty(m) && m.type === EMPTY.type;

/**
 * One underline per method: Type ⌄  [qualifier]  account. Each type asks only
 * for what it needs (METHOD_SPECS): Bank adds a code, Other adds a name, the
 * rest are just an account. There's always one blank row at
 * the end; typing in it opens the next.
 */
function MethodsEditor({ initial }: { initial: PayMethod[] }) {
  const [rows, setRows] = useState<PayMethod[]>([...initial, EMPTY]);

  // Collapse blank rows at the end into exactly one, so a row you're clearing
  // mid-edit doesn't vanish under the cursor.
  const update = (next: PayMethod[]) => {
    const kept = [...next];
    while (kept.length && isUntouched(kept[kept.length - 1])) kept.pop();
    setRows(kept.length < 6 ? [...kept, EMPTY] : kept);
  };
  const set = (i: number, patch: Partial<PayMethod>) =>
    update(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <fieldset>
      <legend className="field-label">Transfer details</legend>
      <input
        type="hidden"
        name="payMethods"
        value={JSON.stringify(rows.filter((m) => !isEmpty(m)))}
      />
      {rows.map((r, i) => {
        const spec = specFor(r.type);
        const q = spec.qualifier;
        const last = i === rows.length - 1 && isUntouched(r);
        return (
          <span key={i} className="field-row">
            <Select
              inline
              className="!w-[5.75rem] !text-primary"
              aria-label="Type"
              value={r.type}
              // A different type means a different qualifier, so drop the old one.
              onChange={(e) => set(i, { type: e.target.value, id: "" })}
            >
              {[...new Set([...METHOD_TYPES, r.type])].map((t) => (
                <option key={t} value={t}>
                  {t || "—"}
                </option>
              ))}
            </Select>
            {q && (
              <input
                value={r.id}
                onChange={(e) => set(i, { id: e.target.value })}
                placeholder={q.placeholder}
                aria-label={q.label}
                inputMode={q.inputMode}
                maxLength={q.maxLength}
                autoComplete="off"
                className={`field num shrink-0 ${q.width}`}
              />
            )}
            <input
              value={r.account}
              onChange={(e) => set(i, { account: e.target.value })}
              placeholder={spec.account.placeholder}
              aria-label="Account"
              inputMode={spec.account.inputMode}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={i === 0 && !initial.length}
              className="field num min-w-0"
            />
            <button
              type="button"
              aria-label="Remove method"
              tabIndex={last ? -1 : 0}
              onClick={() => update(rows.filter((_, j) => j !== i))}
              className={`w-4 shrink-0 text-secondary transition-colors hover:text-primary ${last ? "invisible" : ""}`}
            >
              ×
            </button>
          </span>
        );
      })}
    </fieldset>
  );
}
