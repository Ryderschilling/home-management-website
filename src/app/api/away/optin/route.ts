import { NextRequest, NextResponse } from "next/server";
import { forwardLeadToDashboard } from "@/lib/server/forward-lead";
import { sendOptInEmail } from "@/lib/server/optin-email";

export const runtime = "nodejs";

/**
 * POST /api/away/optin  -  page 1 of the Away on 30A funnel.
 * Email only. Lands in CHM Ops as a NEW lead (with the ad that brought them,
 * from the tracker cookie), and they get a short thank-you email. NEW is
 * exactly the audience the follow-up sequence works, so if they never take
 * the next step the emails pick them up.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true }); // honeypot
    const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: { message: "Add a real email so Ryder can reach you." } }, { status: 400 });
    }
    const cookie = req.cookies.get("chm_attr")?.value ?? "";
    const fromAd = /utmSource%22%3A%22(meta|facebook|fb|instagram|ig)|metaAdId/i.test(cookie);

    await Promise.allSettled([
      forwardLeadToDashboard({
        email,
        source: fromAd ? "Meta ads /away-on-30a opt-in" : "Website /away-on-30a opt-in",
        message: "Owns a home on 30A, wants to know more about our services.",
        eventLabel: "optin",
      }),
      sendOptInEmail(email),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[away/optin] failed:", err);
    return NextResponse.json({ ok: false, error: { message: "That did not go through. Try again." } }, { status: 500 });
  }
}
