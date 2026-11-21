"use client";

import { useActionState } from "react";
import { createLedger, type FormState } from "@/app/actions";
import { CURRENCIES } from "@/lib/money";
import { Select } from "@/components/select";
import { useDefaultName } from "@/components/use-default-name";
import { Required } from "@/components/required";

export function CreateForm({ needsPasscode }: { needsPasscode: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createLedger,
    {},
  );
  const fallback = useDefaultName();

  return (
    <form action={action} className="space-y-8">
      <div className="grid grid-cols-2 gap-x-6">
        <label className="block">
          <span className="field-label">Name</span>
          <input
            name="name"
            className="field"
            placeholder={fallback}
            autoComplete="off"
          />
          <input type="hidden" name="fallbackName" value={fallback} />
        </label>
        <label className="block">
          <span className="field-label">
            Currency
            <Required />
          </span>
          <Select name="currency" defaultValue="TWD">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </label>
      </div>

      {needsPasscode && (
        <label className="block max-w-xs">
          <span className="field-label">Passcode</span>
          <input name="passcode" type="password" className="field" required />
        </label>
      )}

      <div className="flex items-center gap-4">
        <button className="button" disabled={pending}>
          {pending ? "Creating…" : "Create ledger"}
        </button>
        {state.error && <p className="text-sm text-secondary">{state.error}</p>}
      </div>
    </form>
  );
}
