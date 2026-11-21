/**
 * The portfolio's Postgres URL, pointed at the "split" schema. Used by both
 * prisma.config.ts (migrations) and lib/db.ts (runtime).
 */
export function splitDatabaseUrl(): string {
  const raw = process.env.DATABASE_POSTGRES_URL;
  if (!raw) throw new Error("DATABASE_POSTGRES_URL is not set");
  const url = new URL(raw);
  url.searchParams.set("schema", "split");
  return url.toString();
}
