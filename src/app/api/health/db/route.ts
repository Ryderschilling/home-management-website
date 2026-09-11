import { NextResponse } from "next/server";
import { sql } from "@/lib/server/db";

export async function GET() {
  try {
    await sql`SELECT 1`;

    return NextResponse.json({
      ok: true,
      db: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
      },
      { status: 500 }
    );
  }
}