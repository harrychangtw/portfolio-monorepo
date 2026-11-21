import "server-only";
import { db } from "@/lib/db";
import type { ExpenseRow, MemberRow } from "@/lib/ledger";
import { parseMethods } from "@/lib/pay-methods";

export async function loadLedger(slug: string) {
  const ledger = await db.ledger.findUnique({
    where: { slug },
    include: {
      members: { orderBy: { position: "asc" } },
      expenses: {
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { shares: true },
      },
    },
  });
  if (!ledger) return null;

  const members: MemberRow[] = ledger.members.map((m) => ({
    id: m.id,
    name: m.name,
    payMethods: parseMethods(m.payMethods),
  }));
  const expenses: ExpenseRow[] = ledger.expenses.map((e) => ({
    id: e.id,
    kind: e.kind === "settlement" ? "settlement" : "expense",
    title: e.title,
    amount: e.amount,
    currency: e.currency,
    rate: e.rate,
    splitMode: e.splitMode === "custom" ? "custom" : "even",
    payerId: e.payerId,
    date: e.date.toISOString().slice(0, 10),
    // Keep shares in member order so rounding is stable.
    shares: ledger.members.flatMap((m) => {
      const s = e.shares.find((x) => x.memberId === m.id);
      return s ? [{ memberId: m.id, amount: s.amount }] : [];
    }),
  }));

  return { ledger, members, expenses };
}
