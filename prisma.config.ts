import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * The CLI config. Points at the CHM Ops database so `prisma generate` and
 * introspection work, but NEVER run migrate or db push from this repo: the
 * dashboard owns the schema (see scripts/sync-schema.mjs).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.OPS_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
