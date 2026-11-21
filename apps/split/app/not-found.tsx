import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 sm:px-8">
      <p className="section-label mb-3">404</p>
      <h1 className="font-heading text-3xl">No ledger here.</h1>
      <p className="mt-2 text-secondary">Check the link you were sent.</p>
      <Link href="/" className="link mt-8 self-start text-sm">
        Back to Split
      </Link>
    </main>
  );
}
