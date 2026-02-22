import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      handler: "src/app/api/health/db/route.ts::GET", // <— signature
      runtimeDatabaseUrlPrefix: process.env.DATABASE_URL?.slice(0, 24) ?? null,
      prismaVersion: "7.4.0",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        handler: "src/app/api/health/db/route.ts::GET", // <— signature
        runtimeDatabaseUrlPrefix: process.env.DATABASE_URL?.slice(0, 24) ?? null,
        error: {
          code: "DB_HEALTHCHECK_FAILED",
          message: err?.message ?? "Unknown error",
          name: err?.name ?? null,
        },
      },
      { status: 500 }
    );
  }
}