import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { roleForKey, storedKey } from "@/lib/access";
import { balances, settle } from "@/lib/ledger";
import { loadLedger } from "@/lib/queries";
import {
  addMember,
  deleteLedger,
  deleteExpense,
  recordPayment,
  removeMember,
  saveExpense,
  saveMember,
} from "@/app/actions";
import { LedgerView } from "@/components/ledger-view";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ new?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadLedger((await params).slug);
  return { title: data?.ledger.name ?? "Not found" };
}

export default async function LedgerPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const data = await loadLedger(slug);
  if (!data) notFound();

  const { ledger, members, expenses } = data;
  const key = await storedKey(slug);
  const role = roleForKey(key, ledger);
  const rows = balances(ledger.currency, members, expenses);
  const transfers = settle(rows.map((b) => ({ id: b.member.id, net: b.net })));

  // Only the owner sees (and can share) the keyed links.
  let links: { view: string; contributor: string; admin: string } | null = null;
  if (role === "admin" && key) {
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    links = {
      view: `${origin}/g/${slug}`,
      contributor: `${origin}/g/${slug}/join?k=${ledger.contributorKey}`,
      admin: `${origin}/g/${slug}/join?k=${key}`,
    };
  }

  return (
    <LedgerView
      name={ledger.name}
      currency={ledger.currency}
      role={role}
      isNew={(await searchParams).new === "1"}
      links={links}
      members={members}
      expenses={expenses}
      balances={rows}
      transfers={transfers}
      actions={{
        saveExpense: saveExpense.bind(null, slug),
        deleteExpense: deleteExpense.bind(null, slug),
        recordPayment: recordPayment.bind(null, slug),
        saveMember: saveMember.bind(null, slug),
        addMember: addMember.bind(null, slug),
        removeMember: removeMember.bind(null, slug),
        deleteLedger: deleteLedger.bind(null, slug),
      }}
    />
  );
}
