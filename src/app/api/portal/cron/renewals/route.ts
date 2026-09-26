import { NextRequest, NextResponse } from "next/server";
import { sendRenewalReminders } from "@/lib/portal/placement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Runs on the 24th (vercel.json): one "renew for next month" email per month-to-month client. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const r = await sendRenewalReminders();
  return NextResponse.json({ ok: true, ...r });
}
