import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { roleForKey, storeKey } from "@/lib/access";

/** Trades a key in the URL for a cookie, then lands on the clean ledger URL. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const key = request.nextUrl.searchParams.get("k") ?? undefined;
  const ledger = await db.ledger.findUnique({ where: { slug } });

  if (ledger && roleForKey(key, ledger) !== "viewer")
    await storeKey(slug, key!);
  return NextResponse.redirect(new URL(`/g/${slug}`, request.url));
}
