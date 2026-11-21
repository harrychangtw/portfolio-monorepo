"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  hashKey,
  randomToken,
  roleForKey,
  storedKey,
  storeKey,
  type Role,
} from "@/lib/access";
import { CURRENCIES, toMinor } from "@/lib/money";
import { resolveDefaultName } from "@/lib/default-name";
import { parseMethods } from "@/lib/pay-methods";

export type FormState = { error?: string; done?: number };

const RANK: Record<Role, number> = { viewer: 0, contributor: 1, admin: 2 };
const str = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";

class Refusal extends Error {}

/** Loads the ledger and checks this browser's key grants at least `need`. */
async function authorize(slug: string, need: Exclude<Role, "viewer">) {
  const ledger = await db.ledger.findUnique({
    where: { slug },
    include: { members: { orderBy: { position: "asc" } } },
  });
  if (!ledger) throw new Refusal("This ledger no longer exists.");
  const role = roleForKey(await storedKey(slug), ledger);
  if (RANK[role] < RANK[need])
    throw new Refusal(
      need === "admin"
        ? "Only the ledger's owner can do that."
        : "This link is view-only.",
    );
  return { ledger, role };
}

/** Runs a mutation, turning refusals into a form error and revalidating. */
async function mutate(
  slug: string,
  run: () => Promise<void>,
): Promise<FormState> {
  try {
    await run();
  } catch (e) {
    if (e instanceof Refusal) return { error: e.message };
    throw e;
  }
  revalidatePath(`/g/${slug}`);
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

  const slug = randomToken(9);
  const adminKey = randomToken(18);
  await db.ledger.create({
    data: {
      slug,
      name,
      currency,
      adminKeyHash: hashKey(adminKey),
      contributorKey: randomToken(18),
      members: {
        create: names.map((n, position) => ({ name: n, position })),
      },
    },
  });
  await storeKey(slug, adminKey);
  redirect(`/g/${slug}?new=1`);
}

export async function saveExpense(
  slug: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  return mutate(slug, async () => {
    const id = str(form.get("id"));
    const { ledger } = await authorize(slug, id ? "admin" : "contributor");
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

export async function deleteExpense(slug: string, id: string) {
  return mutate(slug, async () => {
    const { ledger } = await authorize(slug, "admin");
    await db.expense.deleteMany({ where: { id, ledgerId: ledger.id } });
  });
}

/** A payment is an entry: `from` pays, and `to` holds the whole share. */
export async function recordPayment(
  slug: string,
  from: string,
  to: string,
  amount: number,
) {
  return mutate(slug, async () => {
    const { ledger } = await authorize(slug, "admin");
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
  slug: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  return mutate(slug, async () => {
    const { ledger, role } = await authorize(slug, "contributor");
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
  slug: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  return mutate(slug, async () => {
    const { ledger } = await authorize(slug, "admin");
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

export async function removeMember(slug: string, id: string) {
  return mutate(slug, async () => {
    const { ledger } = await authorize(slug, "admin");
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
  slug: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { ledger } = await authorize(slug, "admin");
    if (str(form.get("confirm")) !== ledger.name)
      return { error: "Type the ledger's name to confirm." };
    await db.ledger.delete({ where: { id: ledger.id } });
  } catch (e) {
    if (e instanceof Refusal) return { error: e.message };
    throw e;
  }
  (await cookies()).delete(`split_${slug}`);
  redirect("/");
}
