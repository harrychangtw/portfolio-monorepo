import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveLink } from "@/lib/access";
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
import { Remember } from "@/components/remember";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = await resolveLink((await params).token);
  return { title: link?.ledger.name ?? "Not found" };
}

/** Any of a ledger's three links; the link itself decides the role. */
export default async function LedgerPage({ params, searchParams }: Props) {
  const { token } = await params;
  const link = await resolveLink(token);
  if (!link) notFound();
  const { role } = link;
  const data = await loadLedger(link.ledger.slug);
  if (!data) notFound();

  const { ledger, members, expenses } = data;
  const rows = balances(ledger.currency, members, expenses);
  const transfers = settle(rows.map((b) => ({ id: b.member.id, net: b.net })));

  // Only the owner sees (and can share) the keyed links.
  let links: { view: string; contributor: string; admin: string } | null = null;
  if (role === "admin") {
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    links = {
      view: `${origin}/${ledger.slug}`,
      contributor: `${origin}/${ledger.contributorKey}`,
      admin: `${origin}/${token}`,
    };
  }

  return (
    <>
      <Remember token={token} />
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
          saveExpense: saveExpense.bind(null, token),
          deleteExpense: deleteExpense.bind(null, token),
          recordPayment: recordPayment.bind(null, token),
          saveMember: saveMember.bind(null, token),
          addMember: addMember.bind(null, token),
          removeMember: removeMember.bind(null, token),
          deleteLedger: deleteLedger.bind(null, token),
        }}
      />
    </>
  );
}
