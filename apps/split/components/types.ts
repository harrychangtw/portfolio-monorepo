import type { FormState } from "@/app/actions";
import type { Role } from "@/lib/access";
import type { Balance, ExpenseRow, MemberRow, Transfer } from "@/lib/ledger";

export type { Balance, ExpenseRow, FormState, MemberRow, Role, Transfer };

export type Actions = {
  saveExpense: (state: FormState, form: FormData) => Promise<FormState>;
  deleteExpense: (id: string) => Promise<FormState>;
  recordPayment: (
    from: string,
    to: string,
    amount: number,
  ) => Promise<FormState>;
  saveMember: (state: FormState, form: FormData) => Promise<FormState>;
  addMember: (state: FormState, form: FormData) => Promise<FormState>;
  removeMember: (id: string) => Promise<FormState>;
  deleteLedger: (state: FormState, form: FormData) => Promise<FormState>;
};

export type LedgerContext = {
  currency: string;
  role: Role;
  members: MemberRow[];
  nameOf: (id: string) => string;
  actions: Actions;
};
