import { allocate, convert } from "@/lib/money";
import type { PayMethod } from "@/lib/pay-methods";

export type MemberRow = { id: string; name: string; payMethods: PayMethod[] };

export type ExpenseRow = {
  id: string;
  kind: "expense" | "settlement";
  title: string;
  amount: number;
  currency: string;
  rate: number;
  splitMode: "even" | "custom";
  payerId: string;
  date: string; // YYYY-MM-DD
  shares: { memberId: string; amount: number }[];
};

export type Line = {
  expense: ExpenseRow;
  /** What this member paid out, in base minor units. */
  paid: number;
  /** This member's share of the cost, in base minor units. */
  share: number;
};

export type Balance = {
  member: MemberRow;
  paid: number;
  share: number;
  /** paid − share. Positive: is owed money. Negative: owes money. */
  net: number;
  lines: Line[];
};

/**
 * Everything converted into the ledger's base currency. An expense's total is
 * converted once and then re-split across its shares (largest remainder), so
 * every expense nets to exactly zero and the balances always sum to zero.
 */
export function balances(
  base: string,
  members: MemberRow[],
  expenses: ExpenseRow[],
): Balance[] {
  const byId = new Map<string, Balance>(
    members.map((m) => [
      m.id,
      { member: m, paid: 0, share: 0, net: 0, lines: [] },
    ]),
  );

  for (const e of expenses) {
    const total = convert(e.amount, e.currency, base, e.rate);
    const parts = allocate(
      total,
      e.shares.map((s) => s.amount),
    );
    const shareOf = new Map(e.shares.map((s, i) => [s.memberId, parts[i]]));
    const involved = new Set([e.payerId, ...shareOf.keys()]);

    for (const id of involved) {
      const b = byId.get(id);
      if (!b) continue;
      const paid = id === e.payerId ? total : 0;
      const share = shareOf.get(id) ?? 0;
      b.paid += paid;
      b.share += share;
      b.lines.push({ expense: e, paid, share });
    }
  }

  for (const b of byId.values()) b.net = b.paid - b.share;
  return [...byId.values()];
}

export type Transfer = { from: string; to: string; amount: number };

/**
 * Fewest transfers that settle every balance.
 *
 * Any set of people whose balances sum to zero can settle among themselves in
 * (size − 1) transfers, so the minimum is n − (largest number of disjoint
 * zero-sum groups). Up to ~16 people that partition is found exactly with a
 * DP over subsets; past that we fall back to plain greedy, which is still at
 * most n − 1 transfers.
 */
export function settle(nets: { id: string; net: number }[]): Transfer[] {
  const people = nets.filter((p) => p.net !== 0);
  const n = people.length;
  if (n === 0) return [];
  if (n > 16) return greedy(people);

  const full = (1 << n) - 1;
  const sum = new Array<number>(full + 1).fill(0);
  for (let mask = 1; mask <= full; mask++) {
    const low = mask & -mask;
    sum[mask] = sum[mask ^ low] + people[31 - Math.clz32(low)].net;
  }

  // groups[mask]: most zero-sum groups the people in `mask` can be cut into,
  // building `mask` up one person at a time. via[mask] is the person added.
  const groups = new Array<number>(full + 1).fill(0);
  const via = new Array<number>(full + 1).fill(-1);
  for (let mask = 1; mask <= full; mask++) {
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i))) continue;
      const g = groups[mask ^ (1 << i)];
      if (via[mask] === -1 || g > groups[mask]) {
        groups[mask] = g;
        via[mask] = i;
      }
    }
    if (sum[mask] === 0) groups[mask]++;
  }

  // Walk the chosen order back down; every zero-sum prefix closes a group.
  const transfers: Transfer[] = [];
  let group: typeof people = [];
  for (let mask = full; mask; ) {
    const i = via[mask];
    group.push(people[i]);
    mask ^= 1 << i;
    if (sum[mask] === 0) {
      transfers.push(...greedy(group));
      group = [];
    }
  }
  return transfers.sort((a, b) => b.amount - a.amount);
}

/** Largest debtor pays largest creditor until everyone is square. */
function greedy(people: { id: string; net: number }[]): Transfer[] {
  const owed = people
    .filter((p) => p.net > 0)
    .map((p) => ({ ...p }))
    .sort((a, b) => b.net - a.net);
  const owes = people
    .filter((p) => p.net < 0)
    .map((p) => ({ id: p.id, net: -p.net }))
    .sort((a, b) => b.net - a.net);

  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < owes.length && j < owed.length) {
    const amount = Math.min(owes[i].net, owed[j].net);
    out.push({ from: owes[i].id, to: owed[j].id, amount });
    owes[i].net -= amount;
    owed[j].net -= amount;
    if (owes[i].net === 0) i++;
    if (owed[j].net === 0) j++;
  }
  return out;
}
