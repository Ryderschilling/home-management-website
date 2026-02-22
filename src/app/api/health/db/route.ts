import postgres from "postgres";
import { NextResponse } from "next/server";

import { env } from "@/lib/server/env";

export async function GET() {
  const sql = postgres(env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  try {
    await sql`SELECT 1`;

    return NextResponse.json({
      ok: true,
      data: {
        status: "healthy",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DB_HEALTH_CHECK_FAILED",
          message: "Database health check failed.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  } finally {
    await sql.end({ timeout: 1 });
  }
}
