import { NextRequest, NextResponse } from "next/server";
import { placeMonthlyVisits, expireMonthlyPlans } from "@/lib/portal/placement";
import { addMonths, currentMonthKey } from "@/lib/portal/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Runs on the 1st (vercel.json). Places next month's plan visits for every
 * client with a usual weekday, then emails them the dates.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`. Call it by hand with the
 * same header, optionally ?month=YYYY-MM.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const m = req.nextUrl.searchParams.get("month");
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : addMonths(currentMonthKey(), 1);
  const r = await placeMonthlyVisits(month);
  const e = await expireMonthlyPlans();
  return NextResponse.json({ ok: true, month, ...r, ...e });
}
