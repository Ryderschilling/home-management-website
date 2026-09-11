import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Reports only whether the variable exists. Until 9/11/26 this returned the first
// 30 characters of DATABASE_URL, which can include the username and host.
export async function GET() {
  return NextResponse.json({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  });
}
