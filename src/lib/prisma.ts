/**
 * Prisma client for the CHM Ops database (the ONE system of record).
 *
 * This connects to OPS_DATABASE_URL, which is the dashboard's Neon database,
 * NOT this repo's old DATABASE_URL. DATABASE_URL is still used by the legacy
 * marketing lead code in src/lib/server/db.ts and stays on its own database.
 *
 * The schema in prisma/schema.prisma is a generated copy of the dashboard's.
 * Never run migrate or db push from this repo. See scripts/sync-schema.mjs.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __opsPrisma: PrismaClient | undefined;
}

let cached: PrismaClient | undefined;

function getPrisma() {
  if (cached) return cached;
  if (global.__opsPrisma) return (cached = global.__opsPrisma);

  const url = process.env.OPS_DATABASE_URL;
  if (!url) {
    throw new Error("OPS_DATABASE_URL is missing. The portal needs the CHM Ops database connection string.");
  }

  const adapter = new PrismaPg({
    connectionString: url,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 300_000,
    max: 5,
  });

  const prisma = new PrismaClient({ adapter });
  cached = prisma;
  // The global copy only matters in dev, where hot reload re-evaluates modules.
  if (process.env.NODE_ENV !== "production") {
    global.__opsPrisma = prisma;
  }
  return prisma;
}

/** Lazy so a build with no OPS_DATABASE_URL still compiles. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const real = getPrisma() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export default prisma;
