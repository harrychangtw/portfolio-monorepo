import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * No accounts. A ledger has three links, each a single short path:
 *   /<slug>         view: balances, settle-up, entries
 *   /<contributor>  add entries, mark payments, edit transfer details
 *   /<admin>        everything: edit, delete, delete the ledger
 * The role comes from the URL itself, not a cookie, so a link keeps working
 * when an in-app browser (Instagram, LINE) hands it to Safari or Chrome.
 * A cookie per ledger only remembers the best link this browser has seen,
 * for the home page's list.
 */
export type Role = "viewer" | "contributor" | "admin";

export const randomToken = (bytes: number) =>
  randomBytes(bytes).toString("base64url");

export const hashKey = (key: string) =>
  createHash("sha256").update(key).digest("hex");

const cookieName = (slug: string) => `split_${slug}`;

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function roleForKey(
  key: string | undefined,
  ledger: { adminKeyHash: string; contributorKey: string },
): Role {
  if (!key) return "viewer";
  if (same(hashKey(key), ledger.adminKeyHash)) return "admin";
  if (same(key, ledger.contributorKey)) return "contributor";
  return "viewer";
}

export const RANK: Record<Role, number> = {
  viewer: 0,
  contributor: 1,
  admin: 2,
};

/** Which ledger a link opens, and as whom. */
export async function resolveLink(token: string) {
  if (!/^[\w-]{6,64}$/.test(token)) return null;
  const ledger = await db.ledger.findFirst({
    where: {
      OR: [
        { slug: token },
        { contributorKey: token },
        { adminKeyHash: hashKey(token) },
      ],
    },
  });
  if (!ledger) return null;
  const role = ledger.slug === token ? "viewer" : roleForKey(token, ledger);
  return { ledger, role };
}

export async function storedKey(slug: string) {
  return (await cookies()).get(cookieName(slug))?.value;
}

export async function storeKey(slug: string, key: string) {
  (await cookies()).set(cookieName(slug), key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}

/** Every ledger this browser has opened, with the link it opened it by. */
export async function storedLinks(): Promise<Map<string, string>> {
  return new Map(
    (await cookies())
      .getAll()
      .filter((c) => c.name.startsWith("split_"))
      .map((c) => [c.name.slice("split_".length), c.value]),
  );
}
