"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  hashKey,
  randomToken,
  RANK,
  resolveLink,
  roleForKey,
  storedKey,
  storeKey,
  type Role,
} from "@/lib/access";
import { CURRENCIES, toMinor } from "@/lib/money";
import { resolveDefaultName } from "@/lib/default-name";
import { parseMethods } from "@/lib/pay-methods";

export type FormState = { error?: string; done?: number };

const str = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";

class Refusal extends Error {}

/** Loads the ledger and checks the page's link grants at least `need`. */
async function authorize(token: string, need: Exclude<Role, "viewer">) {
  const link = await resolveLink(token);
  if (!link) throw new Refusal("This ledger no longer exists.");
  const { role } = link;
  const ledger = await db.ledger.findUniqueOrThrow({
    where: { id: link.ledger.id },
    include: { members: { orderBy: { position: "asc" } } },
  });
  if (RANK[role] < RANK[need])
    throw new Refusal(
      need === "admin"
        ? "Only the ledger's owner can do that."
        : "This link is view-only.",
    );
  return { ledger, role };
}

/** Runs a mutation, turning refusals into a form error and revalidating. */
async function mutate(run: () => Promise<void>): Promise<FormState> {
  try {
    await run();
  } catch (e) {
    if (e instanceof Refusal) return { error: e.message };
    throw e;
  }
  revalidatePath("/[token]", "page");
  return { done: Date.now() };
}

// ---------------------------------------------------------------------------

export async function createLedger(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const passcode = process.env.SPLIT_CREATE_PASSCODE;
  if (passcode && str(form.get("passcode")) !== passcode)
    return { error: "Wrong passcode." };

  const name =
    str(form.get("name")).slice(0, 80) ||
    resolveDefaultName(str(form.get("fallbackName")));
  const currency = str(form.get("currency"));
  const names = form
    .getAll("member")
    .map((v) => str(v).slice(0, 40))
    .filter(Boolean);

  if (!(CURRENCIES as readonly string[]).includes(currency))
    return { error: "Pick a currency." };
  if (names.length > 16) return { error: "Up to 16 people per ledger." };
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length)
    return { error: "Each person needs a different name." };

  // 6 random bytes is 8 URL characters: short enough to paste, far too many
  // to guess. The owner's link gets twice that.
  const slug = randomToken(6);
  const adminKey = randomToken(12);
  await db.ledger.create({
    data: {
      slug,
      name,
      currency,
      adminKeyHash: hashKey(adminKey),
      contributorKey: randomToken(6),
      members: {
        create: names.map((n, position) => ({ name: n, position })),
      },
    },
  });
  await storeKey(slug, adminKey);
  redirect(`/${adminKey}?new=1`);
}

export async function saveExpense(
  token: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  return mutate(async () => {
    const id = str(form.get("id"));
    const { ledger } = await authorize(token, id ? "admin" : "contributor");
    const memberIds = new Set(ledger.members.map((m) => m.id));

    const title =
      str(form.get("title")).slice(0, 120) ||
      resolveDefaultName(str(form.get("fallbackName")));
    const currency = str(form.get("currency"));
    const amount = toMinor(str(form.get("amount")), currency);
    const payerId = str(form.get("payerId"));
    const date = str(form.get("date"));
    const splitMode =
      str(form.get("splitMode")) === "custom" ? "custom" : "even";
    const rate =
      currency === ledger.currency ? 1 : Number(str(form.get("rate")));

    if (!(CURRENCIES as readonly string[]).includes(currency))
      throw new Refusal("Unknown currency.");
    if (!amount) throw new Refusal("Enter an amount.");
    if (!(rate > 0 && Number.isFinite(rate)))
      throw new Refusal(`Enter the rate to ${ledger.currency}.`);
    if (!memberIds.has(payerId)) throw new Refusal("Who paid?");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Refusal("Pick a date.");

    // The form sends every person's final share (locked or auto-split), in
    // the expense's currency. Zero or blank means they're not in it.
    const shares: { memberId: string; amount: number }[] = [];
    for (const m of ledger.members) {
      const raw = str(form.get(`share_${m.id}`));
      if (!raw) continue;
      const part = toMinor(raw, currency);
      if (part === null) throw new Refusal(`Check ${m.name}'s amount.`);
      if (part > 0) shares.push({ memberId: m.id, amount: part });
    }
    if (!shares.length) throw new Refusal("Someone has to share it.");
    const sum = shares.reduce((a, s) => a + s.amount, 0);
    if (sum !== amount)
      throw new Refusal("Everyone's shares must add up to the total.");

    const data = {
      title,
      amount,
      currency,
      rate,
      splitMode,
      payerId,
      date: new Date(`${date}T00:00:00Z`),
    };

    if (id) {
      await db.$transaction([
        db.share.deleteMany({ where: { expenseId: id } }),
        db.expense.update({
          where: { id, ledgerId: ledger.id },
          data: { ...data, shares: { create: shares } },
        }),
      ]);
    } else {
      await db.expense.create({
        data: { ...data, ledgerId: ledger.id, shares: { create: shares } },
      });
    }
  });
}

export async function deleteExpense(token: string, id: string) {
  return mutate(async () => {
    const { ledger } = await authorize(token, "admin");
    await db.expense.deleteMany({ where: { id, ledgerId: ledger.id } });
  });
}

/** A payment is an entry: `from` pays, and `to` holds the whole share. */
export async function recordPayment(
  token: string,
  from: string,
  to: string,
  amount: number,
) {
  return mutate(async () => {
    const { ledger } = await authorize(token, "admin");
    const ids = new Set(ledger.members.map((m) => m.id));
    if (!ids.has(from) || !ids.has(to) || from === to)
      throw new Refusal("Unknown people.");
    if (!Number.isSafeInteger(amount) || amount <= 0)
      throw new Refusal("Enter an amount.");
    await db.expense.create({
      data: {
        ledgerId: ledger.id,
        kind: "settlement",
        title: "Payment",
        amount,
        currency: ledger.currency,
        payerId: from,
        date: new Date(new Date().toISOString().slice(0, 10)),
        shares: { create: [{ memberId: to, amount }] },
      },
    });
  });
}

/** Contributors may set transfer details; only the owner renames people. */
export async function saveMember(
  token: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  return mutate(async () => {
    const { ledger, role } = await authorize(token, "contributor");
    const id = str(form.get("id"));
    const member = ledger.members.find((m) => m.id === id);
    if (!member) throw new Refusal("Unknown person.");

    const payMethods = parseMethods(str(form.get("payMethods")));
    const name = str(form.get("name")).slice(0, 40);
    const rename = role === "admin" && name && name !== member.name;
    if (
      rename &&
      ledger.members.some(
        (m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase(),
      )
    )
      throw new Refusal("Someone already has that name.");

    await db.member.update({
      where: { id },
      data: rename ? { payMethods, name } : { payMethods },
    });
  });
}

export async function addMember(
  token: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  return mutate(async () => {
    const { ledger } = await authorize(token, "admin");
    const name = str(form.get("name")).slice(0, 40);
    if (!name) throw new Refusal("Enter a name.");
    if (ledger.members.length >= 16)
      throw new Refusal("Up to 16 people per ledger.");
    if (ledger.members.some((m) => m.name.toLowerCase() === name.toLowerCase()))
      throw new Refusal("Someone already has that name.");
    await db.member.create({
      data: {
        ledgerId: ledger.id,
        name,
        position: (ledger.members.at(-1)?.position ?? -1) + 1,
      },
    });
  });
}

export async function removeMember(token: string, id: string) {
  return mutate(async () => {
    const { ledger } = await authorize(token, "admin");
    const used = await db.expense.count({
      where: {
        ledgerId: ledger.id,
        OR: [{ payerId: id }, { shares: { some: { memberId: id } } }],
      },
    });
    if (used) throw new Refusal("They're part of an entry, so they stay.");
    await db.member.deleteMany({ where: { id, ledgerId: ledger.id } });
  });
}

/** Deletes the ledger and everything in it. The owner types its name to confirm. */
export async function deleteLedger(
  token: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  let ledger;
  try {
    ({ ledger } = await authorize(token, "admin"));
    if (str(form.get("confirm")) !== ledger.name)
      return { error: "Type the ledger's name to confirm." };
    // Entries go first: their shares and payers reference people with
    // onDelete: Restrict, so a single cascading ledger delete trips the FK.
    await db.$transaction([
      db.expense.deleteMany({ where: { ledgerId: ledger.id } }),
      db.ledger.delete({ where: { id: ledger.id } }),
    ]);
  } catch (e) {
    if (e instanceof Refusal) return { error: e.message };
    throw e;
  }
  (await cookies()).delete(`split_${ledger.slug}`);
  redirect("/");
}

/**
 * Remembers this browser opened the ledger, for the home page's list. Never
 * trades a stronger link for a weaker one (the owner opening the view link).
 */
export async function remember(token: string) {
  const link = await resolveLink(token);
  if (!link) return;
  const { slug } = link.ledger;
  const held = await storedKey(slug);
  if (held === token) return;
  if (held && RANK[roleForKey(held, link.ledger)] > RANK[link.role]) return;
  await storeKey(slug, token);
}
