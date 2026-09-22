import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { forwardLeadToDashboard } from "@/lib/server/forward-lead";
import { sendLeadWelcome } from "@/lib/server/lead-welcome";

export const runtime = "nodejs";

/**
 * POST /api/storm-check
 *
 * Storm Check sign-up (added 9/11/26). Pricing set by Ryder that day:
 * $100 per storm for owners not on a plan, $50 per storm for plan clients.
 * Nothing is charged at sign-up; Ryder invoices in Square.
 *
 * The lead goes to the dashboard through the existing intake bridge, so /leads
 * stays the single source of truth. Ryder gets an email. Since 9/21/26 the
 * homeowner also gets the approved instant welcome email (lead-welcome.ts),
 * a standing template Ryder signed off on for every new lead.
 */

const OWNER_FALLBACK = "coastalhomemanagement30a@gmail.com";

function clean(v: unknown, max = 300): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Honeypot: a filled hidden field means a bot. Answer ok and drop it.
    if (clean(body.company)) return NextResponse.json({ ok: true });

    const firstName = clean(body.firstName, 80);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 40);
    const address = clean(body.address, 200);
    const neighborhood = clean(body.neighborhood, 80);
    const onPlan = body.onPlan === "yes" ? "yes" : body.onPlan === "no" ? "no" : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: { message: "Add a valid email so the storm photos have somewhere to go." } },
        { status: 400 }
      );
    }
    if (!address) {
      return NextResponse.json(
        { ok: false, error: { message: "Add the property address so the right house gets checked." } },
        { status: 400 }
      );
    }

    const planLine =
      onPlan === "yes" ? "Says they are on a plan ($50 per storm)" :
      onPlan === "no" ? "Not on a plan ($100 per storm)" :
      "Did not say whether they are on a plan";

    await forwardLeadToDashboard({
      name: firstName || null,
      email,
      phone: phone || null,
      community: neighborhood || null,
      source: "Website /storm-check",
      message: `Storm Check sign-up. Address: ${address}. ${planLine}.`,
    });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    if (apiKey && from) {
      const to = process.env.BOOKING_NOTIFY_EMAIL || process.env.UPLOAD_NOTIFY_EMAIL || OWNER_FALLBACK;
      const rows: Array<[string, string]> = [
        ["Name", firstName || "Not given"],
        ["Email", email],
        ["Phone", phone || "Not given"],
        ["Address", address],
        ["Neighborhood", neighborhood || "Not given"],
        ["Plan", planLine],
      ];
      const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;color:#0a0a0a">
  <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#96969e;margin:0 0 12px">Storm Check sign-up</p>
  <table style="border-collapse:collapse;width:100%">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:12px;color:#96969e;width:120px">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:15px">${esc(v)}</td></tr>`
    )
    .join("")}</table>
  <p style="font-size:13px;color:#56565c;margin:16px 0 0">Also in the dashboard under Leads.</p>
</div>`;
      try {
        await new Resend(apiKey).emails.send({
          from,
          to,
          replyTo: email,
          subject: `Storm Check sign-up, ${firstName || email}${neighborhood ? ` (${neighborhood})` : ""}`,
          html,
        });
      } catch (err) {
        console.error("[storm-check] notify email failed:", err);
      }
    }

    await sendLeadWelcome({ firstName, email, requestLine: "Your home is on the Storm Check list." });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[storm-check] failed:", err);
    return NextResponse.json(
      { ok: false, error: { message: "That did not go through. Try again, or call." } },
      { status: 500 }
    );
  }
}
