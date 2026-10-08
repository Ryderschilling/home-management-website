import { NextRequest, NextResponse } from "next/server";
import { forwardLeadToDashboard } from "@/lib/server/forward-lead";
import { sendCapiEvent } from "@/lib/server/metaCapi";
import { resolveAttribution, isPaidTouch } from "@/lib/server/attribution";
import { sendLeadAlert } from "@/lib/server/lead-alert";
import { hit } from "@/lib/portal/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/away/storm  -  the after-storm check request on
 * /away-on-30a/after-the-storm (Hurricane Isaias Meta ad, added 10/8/26).
 *
 * One form, everything Ryder needs: name, contact, address, area, what they
 * want done. Lands in CHM Ops as a lead with the ad that brought them, sent as
 * step "info" so the lead inbox writes Ryder a Gmail reply DRAFT and pings his
 * phone (nothing personal auto-sends). Ryder also gets the lead alert email.
 *
 * Meta hears "Lead" only for a new person, same rule as the opt-in, and the
 * browser pixel follows the `fire` flag so both sides agree.
 */
const META_SRC = /^(meta|facebook|fb|instagram|ig|an|msg)$/i;
const clean = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (clean(b.company)) return NextResponse.json({ ok: true, fire: false }); // honeypot

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const limit = await hit(`storm:${ip}`, 8, 60).catch(() => ({ ok: true }));
    if (!limit.ok) return NextResponse.json({ ok: true, fire: false });

    const name = clean(b.name, 100);
    const email = clean(b.email, 160).toLowerCase();
    const phone = clean(b.phone, 40);
    const address = clean(b.address, 200);
    const area = clean(b.area, 80);
    const needs = Array.isArray(b.needs) ? b.needs.map((n) => clean(n, 80)).filter(Boolean).slice(0, 10) : [];
    const notes = clean(b.notes, 1000);

    if (!name) return NextResponse.json({ ok: false, error: { message: "Add your name." } }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, error: { message: "Add a real email so the photos have somewhere to go." } }, { status: 400 });
    }
    if (!address) return NextResponse.json({ ok: false, error: { message: "Add the home's address." } }, { status: 400 });

    const resolved = await resolveAttribution(b.attr);
    const { attribution } = resolved;
    const fromAd = !!attribution && (!!attribution.metaAdId || (META_SRC.test(attribution.utmSource || "") && isPaidTouch(attribution as Record<string, string | undefined>)));

    const message =
      `After-storm check request (Hurricane Isaias). Address: ${address}. Area: ${area || "Not given"}. ` +
      `Wants: ${needs.length ? needs.join(", ") : "Not given"}. Mobile: ${phone || "Not given"}. Notes: ${notes || "Nothing"}.` +
      (resolved.matchedBy === "recent-ad-visit" ? " Ad credit matched from a Meta ad visit just before the request." : "");

    const result = await forwardLeadToDashboard(
      {
        name,
        email,
        phone: phone || null,
        community: area || null,
        source: fromAd ? "Meta ads /away-on-30a/after-the-storm" : "Website /away-on-30a/after-the-storm",
        message,
        eventLabel: "info",
      },
      { resolved }
    );

    const isNew = !result.ok || result.created === true;
    await Promise.allSettled([
      sendLeadAlert({
        funnel: `After-storm check${fromAd ? ", from a Meta ad" : ""}. ${address}. Wants: ${needs.join(", ") || "not given"}${notes ? `. Notes: ${notes}` : ""}`,
        email,
        name,
        phone: phone || null,
        attribution,
        result,
      }),
      isNew
        ? sendCapiEvent({ eventName: "Lead", eventId: typeof b.eventId === "string" ? b.eventId.slice(0, 64) : null, email, phone: phone || null, firstName: name.split(/\s+/)[0] || null })
        : Promise.resolve(),
    ]);
    return NextResponse.json({ ok: true, fire: isNew });
  } catch (err) {
    console.error("[away/storm] failed:", err);
    return NextResponse.json({ ok: false, error: { message: "That did not go through. Try again, or text 309-415-8793." } }, { status: 500 });
  }
}
