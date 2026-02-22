import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is missing.");
}

function getPrisma() {
  if (global.__prisma) return global.__prisma;

  const pool = new Pool({
    connectionString: url,
    // Neon needs SSL; sslmode=require in URL is usually enough.
    // This extra ssl block is harmless and stabilizes local dev.
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") global.__prisma = prisma;
  return prisma;
}

const prisma = getPrisma();
export default prisma;