import { NextResponse } from "next/server";
import { sql } from "@/lib/server/db";

export async function GET() {
  try {
    await sql`SELECT 1`;

    return NextResponse.json({
      ok: true,
      db: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}