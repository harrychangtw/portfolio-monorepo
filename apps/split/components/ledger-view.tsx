"use client";

import Link from "next/link";
import { useActionState, useCallback, useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet } from "@/components/sheet";
import { SettleUp } from "@/components/settle-up";
import { BalanceList } from "@/components/balance-list";
import { EntryList } from "@/components/entry-list";
import { ExpenseForm } from "@/components/expense-form";
import { PeopleCard } from "@/components/people-card";
import type {
  Actions,
  FormState,
  Balance,
  ExpenseRow,
  LedgerContext,
  MemberRow,
  Role,
  Transfer,
} from "@/components/types";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Owner",
  contributor: "Contributor",
  viewer: "View only",
};

export function LedgerView(props: {
  name: string;
  currency: string;
  role: Role;
  isNew: boolean;
  links: { view: string; contributor: string; admin: string } | null;
  members: MemberRow[];
  expenses: ExpenseRow[];
  balances: Balance[];
  transfers: Transfer[];
  actions: Actions;
}) {
  const { name, currency, role, members, expenses, actions } = props;
  // Remounting the composer after a save clears it for the next entry.
  const [composerKey, setComposerKey] = useState(0);
  const resetComposer = useCallback(() => setComposerKey((k) => k + 1), []);
  const [showLinks, setShowLinks] = useState(props.isNew);

  const ctx: LedgerContext = useMemo(() => {
    const names = new Map(members.map((m) => [m.id, m.name]));
    return {
      currency,
      role,
      members,
      nameOf: (id) => names.get(id) ?? "Someone",
      actions,
    };
  }, [currency, role, members, actions]);

  const spent =
    props.balances.reduce((a, b) => a + b.share, 0) -
    // Payments move money between people; they aren't spending.
    expenses
      .filter((e) => e.kind === "settlement")
      .reduce((a, e) => a + e.amount, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-8">
      <nav className="mb-8 flex items-center justify-between gap-4 sm:mb-12">
        <h1 className="flex min-w-0 items-center gap-3 font-heading text-sm uppercase tracking-wider">
          <Link
            href="/"
            className="text-secondary transition-colors hover:text-primary"
          >
            Split
          </Link>
          <span className="h-3.5 w-px shrink-0 bg-border" aria-hidden />
          <span className="truncate">{name}</span>
        </h1>
        {/* Icon buttons are 32px targets around 16px glyphs (8px of air each
            side), so the label's 8px margin makes every visible gap 16px. */}
        <div className="-mr-2 flex shrink-0 items-center">
          <span className="mr-2 text-xs text-secondary">
            {ROLE_LABEL[role]}
          </span>
          {props.links && (
            <button
              type="button"
              aria-label="Share links"
              onClick={() => setShowLinks(true)}
              className="grid h-8 w-8 place-items-center rounded-full text-secondary transition-colors hover:text-primary"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                <path
                  d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.2-2.2a2.6 2.6 0 0 0-3.7-3.7l-.9.9M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.9-.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <ThemeToggle />
        </div>
      </nav>

      <div className="space-y-3">
        {members.length < 2 && <PeopleCard ctx={ctx} />}
        {members.length > 0 && (
          <BalanceList ctx={ctx} balances={props.balances} spent={spent} />
        )}
        {role !== "viewer" && members.length >= 2 && (
          <section className="card">
            <ExpenseForm
              key={composerKey}
              ctx={ctx}
              expenses={expenses}
              onDone={resetComposer}
            />
          </section>
        )}
        <EntryList ctx={ctx} expenses={expenses} />
        <SettleUp ctx={ctx} transfers={props.transfers} expenses={expenses} />
        {members.length >= 2 && <PeopleCard ctx={ctx} />}
      </div>

      {props.links && (
        <Sheet
          open={showLinks}
          onClose={() => setShowLinks(false)}
          title={props.isNew ? "Ledger created" : "Links"}
        >
          <LinkRows links={props.links} />
          <DeleteLedger name={name} action={actions.deleteLedger} />
        </Sheet>
      )}
    </main>
  );
}

function LinkRows({
  links,
}: {
  links: { view: string; contributor: string; admin: string };
}) {
  const rows = [
    {
      label: "View",
      note: "Balances and entries. For the group chat.",
      url: links.view,
    },
    {
      label: "Contribute",
      note: "Can also add entries and transfer details.",
      url: links.contributor,
    },
    {
      label: "Owner",
      note: "Full control. Keep this one to yourself.",
      url: links.admin,
    },
  ];
  return (
    <div>
      <p className="mb-4 text-sm text-secondary">
        This browser stays signed in as owner. Save the owner link to edit from
        another device.
      </p>
      <ul className="border-t">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-baseline justify-between gap-4 border-b py-3"
          >
            <div className="min-w-0">
              <p className="text-sm">{r.label}</p>
              <p className="text-xs text-secondary">{r.note}</p>
            </div>
            <CopyButton value={r.url} label="Copy link" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeleteLedger({
  name,
  action,
}: {
  name: string;
  action: (state: FormState, form: FormData) => Promise<FormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );

  if (!open) {
    return (
      <button className="link mt-8 text-xs" onClick={() => setOpen(true)}>
        Delete ledger
      </button>
    );
  }
  return (
    <form action={submit} className="mt-8 space-y-4 border-t pt-4">
      <p className="text-sm text-secondary">
        This deletes every entry and payment for everyone, for good. Type{" "}
        <span className="text-primary">{name}</span> to confirm.
      </p>
      <input name="confirm" className="field" autoComplete="off" autoFocus />
      <div className="flex items-center gap-3">
        <button
          className="inline-flex h-10 items-center justify-center rounded-full border border-negative bg-negative px-5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40"
          disabled={pending}
        >
          {pending ? "Deleting…" : "Delete ledger"}
        </button>
        <button
          type="button"
          className="button-ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
      {state.error && <p className="text-sm text-secondary">{state.error}</p>}
    </form>
  );
}
