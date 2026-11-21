import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * No accounts. A ledger has three links:
 *   /g/<slug>                     view: balances, settle-up, entries
 *   /g/<slug>/join?k=<contrib>    add entries, edit transfer details
 *   /g/<slug>/join?k=<admin>      everything: edit, delete, mark paid
 * The join route stores the key in an httpOnly cookie scoped to the ledger
 * and redirects to the clean URL, so keys don't linger in the address bar.
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

/** Every ledger this browser holds a key for, for the home page. */
export async function storedSlugs(): Promise<string[]> {
  return (await cookies())
    .getAll()
    .filter((c) => c.name.startsWith("split_"))
    .map((c) => c.name.slice("split_".length));
}
