import { PrismaClient } from "@/lib/generated/prisma";
import { splitDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: splitDatabaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
