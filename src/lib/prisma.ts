import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

  const adapter = new PrismaPg({
    connectionString: url,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 300_000,
  });

  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    global.__prisma = prisma;
  }

  return prisma;
}

const prisma = getPrisma();
export default prisma;