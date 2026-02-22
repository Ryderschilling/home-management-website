import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const url = process.env.DATABASE_URL;
  return NextResponse.json({
    hasDatabaseUrl: Boolean(url),
    startsWith: url ? url.slice(0, 30) : null,
  });
}