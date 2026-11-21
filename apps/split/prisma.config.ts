import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import { splitDatabaseUrl } from "./lib/database-url";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

// `prisma generate` runs on install, before any database env exists.
if (process.env.DATABASE_POSTGRES_URL) {
  process.env.SPLIT_DATABASE_URL = splitDatabaseUrl();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  engine: "classic",
  datasource: { url: process.env.SPLIT_DATABASE_URL ?? "" },
});
