import { NextRequest, NextResponse } from "next/server";
import { forwardLeadToDashboard } from "@/lib/server/forward-lead";
import { sendOptInEmail } from "@/lib/server/optin-email";
import { sendCapiEvent } from "@/lib/server/metaCapi";
import { readAttribution, isPaidTouch } from "@/lib/server/attribution";
import { sendLeadAlert } from "@/lib/server/lead-alert";
import { hit } from "@/lib/portal/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/away/optin  -  page 1 of the Away on 30A funnel.
 * Email only. Lands in CHM Ops as a NEW lead (with the ad that brought them,
 * from the tracker cookie), they get a short thank-you email, and Ryder gets
 * a heads-up (which doubles as the backup record if CHM Ops did not take it).
 * The thank-you email now comes from CHM Ops through Gmail (lead inbox); this
 * route only sends its own Resend copy as a fallback.
 *
 * Meta only hears "Lead" for a NEW person (9/29/26 audit): a repeat opt-in or
 * a bot must never teach the ad set what a lead looks like. The response's
 * `fire` flag tells the browser pixel the same thing, so both sides agree.
 */
const META_SRC = /^(meta|facebook|fb|instagram|ig|an|msg)$/i;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true, fire: false }); // honeypot
    const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, error: { message: "Add a real email so Ryder can reach you." } }, { status: 400 });
    }

    // Bots posting straight to this route: a handful per IP per hour is plenty
    // for a human. Over the limit looks like success, so nothing is learned.
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const limit = await hit(`optin:${ip}`, 8, 60).catch(() => ({ ok: true }));
    if (!limit.ok) return NextResponse.json({ ok: true, fire: false });

    const { attribution } = await readAttribution();
    const fromAd = !!attribution && (!!attribution.metaAdId || (META_SRC.test(attribution.utmSource || "") && isPaidTouch(attribution as Record<string, string | undefined>)));

    const result = await forwardLeadToDashboard({
      email,
      source: fromAd ? "Meta ads /away-on-30a opt-in" : "Website /away-on-30a opt-in",
      message: "Owns a home on 30A, wants to know more about our services.",
      eventLabel: "optin",
    });
    // CHM Ops sends the welcome from the CHM Gmail (same sender and thread as
    // every later email). Only when it could not do we send the site's copy.
    if (!result.welcomeSent) await sendOptInEmail(email).catch(() => false);

    // Not saved = we cannot tell new from repeat, so count it (Ryder is warned by email).
    const isNew = !result.ok || result.created === true;
    await Promise.allSettled([
      sendLeadAlert({ funnel: fromAd ? "Away on 30A opt-in, from a Meta ad" : "Away on 30A opt-in", email, attribution, result }),
      isNew ? sendCapiEvent({ eventName: "Lead", eventId: typeof body.eventId === "string" ? body.eventId.slice(0, 64) : null, email }) : Promise.resolve(),
    ]);
    return NextResponse.json({ ok: true, fire: isNew });
  } catch (err) {
    console.error("[away/optin] failed:", err);
    return NextResponse.json({ ok: false, error: { message: "That did not go through. Try again." } }, { status: 500 });
  }
}
