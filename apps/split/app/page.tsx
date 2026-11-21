import Link from "next/link";
import { db } from "@/lib/db";
import { storedSlugs } from "@/lib/access";
import { CreateForm } from "@/components/create-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const slugs = await storedSlugs();
  const ledgers = slugs.length
    ? await db.ledger.findMany({
        where: { slug: { in: slugs } },
        orderBy: { createdAt: "desc" },
        select: {
          slug: true,
          name: true,
          _count: { select: { members: true } },
        },
      })
    : [];

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-8">
      <nav className="mb-10 flex items-center justify-between sm:mb-14">
        <span className="font-heading text-sm uppercase tracking-wider">
          Split
        </span>
        <span className="-mr-2">
          <ThemeToggle />
        </span>
      </nav>

      {ledgers.length > 0 && (
        <section className="card mb-3">
          <h2 className="section-label mb-2">Your ledgers</h2>
          <ul>
            {ledgers.map((l) => (
              <li key={l.slug} className="group">
                <Link
                  href={`/g/${l.slug}`}
                  className="group flex items-baseline justify-between border-b py-3 group-last:border-b-0"
                >
                  <span className="transition-colors group-hover:text-accent">
                    {l.name}
                  </span>
                  <span className="text-sm text-secondary">
                    {l._count.members} people
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="section-label mb-6">New ledger</h2>
        <CreateForm
          needsPasscode={Boolean(process.env.SPLIT_CREATE_PASSCODE)}
        />
      </section>
    </main>
  );
}
