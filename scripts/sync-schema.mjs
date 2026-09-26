/**
 * Copy the CHM Ops dashboard's Prisma schema into this repo.
 *
 * The dashboard (chm-dashboard/prisma/schema.prisma) OWNS the schema. Both apps
 * share one Neon database, so this repo carries a verbatim copy of every enum
 * and model, with only the header swapped for Prisma 7 (no `url` in the
 * datasource block; the URL comes from prisma.config.ts).
 *
 *   node scripts/sync-schema.mjs
 *   node scripts/sync-schema.mjs /path/to/chm-dashboard/prisma/schema.prisma
 *
 * NEVER run `prisma migrate` or `prisma db push` from this repo. Schema changes
 * happen in the dashboard, get pushed from there, then this script runs.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  process.argv[2],
  process.env.CHM_DASHBOARD_SCHEMA,
  resolve(homedir(), "Documents/Claude/Projects/Coastal Home Management/chm-dashboard/prisma/schema.prisma"),
  resolve(here, "../../chm-dashboard/prisma/schema.prisma"),
].filter(Boolean);

const src = candidates.find((p) => existsSync(p));
if (!src) {
  console.error("Could not find the dashboard schema. Pass its path as the first argument.");
  process.exit(1);
}

const raw = readFileSync(src, "utf8");
// Drop the dashboard's generator + datasource blocks; everything after is shared.
const body = raw.replace(/^generator[\s\S]*?\n}\n\s*datasource[\s\S]*?\n}\n/m, "").trimStart();

const header = `// GENERATED FROM THE CHM OPS DASHBOARD. DO NOT EDIT BY HAND.
// Source: chm-dashboard/prisma/schema.prisma (the owner of this schema).
// Refresh with: node scripts/sync-schema.mjs
// Never run prisma migrate or db push from this repo.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

`;

const out = resolve(here, "../prisma/schema.prisma");
writeFileSync(out, header + body);
console.log(`schema synced from ${src}`);
