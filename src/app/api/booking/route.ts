import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

/**
 * POST /api/booking
 *
 * Fires AFTER /api/marketing/lead has already saved the lead. This route
 * has one job: get the appointment details in front of Ryder immediately,
 * and send the homeowner a confirmation so the request feels real.
 *
 * It intentionally does not write to the database. The lead is already
 * saved by the time this runs, so if email is misconfigured the worst case
 * is a missing notification, never a lost lead.
 *
 * Env used (all already present for the existing lead flow):
 *   RESEND_API_KEY   required
 *   FROM_EMAIL       required, verified Resend sender
 *   BOOKING_NOTIFY_EMAIL  optional, falls back to UPLOAD_NOTIFY_EMAIL
 *   REPLY_TO_EMAIL   optional
 */

const OWNER_FALLBACK = "coastalhomemanagement30a@gmail.com";

function clean(v: unknown, max = 400): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const WINDOW_LABELS: Record<string, string> = {
  morning: "Morning (8am – 11am)",
  midday: "Midday (11am – 2pm)",
  afternoon: "Afternoon (2pm – 5pm)",
  flexible: "Flexible, whatever works",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const firstName = clean(body.firstName, 80);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 40);
    const neighborhood = clean(body.neighborhood, 80);
    const address = clean(body.address, 200);
    const plan = clean(body.plan, 80);
    const date = clean(body.date, 20);
    const windowId = clean(body.window, 20);
    const notes = clean(body.notes, 1200);
    const source = clean(body.source, 60) || "site";

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing email" } },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;

    // No mail configured is not a client error, the lead is already saved.
    if (!apiKey || !from) {
      return NextResponse.json({ ok: true, data: { emailed: false } });
    }

    const to = process.env.BOOKING_NOTIFY_EMAIL || process.env.UPLOAD_NOTIFY_EMAIL || OWNER_FALLBACK;
    const replyTo = process.env.REPLY_TO_EMAIL || undefined;
    const resend = new Resend(apiKey);

    const windowLabel = WINDOW_LABELS[windowId] || windowId || "Not specified";
    const who = firstName || "Someone";

    const rows: Array<[string, string]> = [
      ["Name", firstName || ", "],
      ["Email", email],
      ["Phone", phone || ", "],
      ["Neighborhood", neighborhood || ", "],
      ["Address", address || ", "],
      ["Preferred day", date || ", "],
      ["Arrival window", windowLabel],
      ["Plan interest", plan || ", "],
      ["Came from", source],
    ];

    const rowsHtml = rows
      .map(
        ([k, v]) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#96969e;width:150px;vertical-align:top;">${esc(k)}</td>
          <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:15px;color:#0a0a0a;">${esc(v)}</td>
        </tr>`
      )
      .join("");

    /* ── 1. Notify Ryder ────────────────────────────────────────── */
    const ownerHtml = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:34px 30px;background:#fff;border-top:3px solid #0d7f79;">
  <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#96969e;">Walkthrough request</p>
  <h1 style="margin:0 0 26px;font-size:24px;line-height:1.15;letter-spacing:-0.02em;color:#0a0a0a;">
    ${esc(who)} wants a walkthrough${neighborhood ? ` in ${esc(neighborhood)}` : ""}.
  </h1>
  <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
  ${
    notes
      ? `<div style="margin-top:24px;padding:16px 18px;background:#f4f4f1;border-left:2px solid #0d7f79;">
           <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#96969e;">Their notes</p>
           <p style="margin:0;font-size:15px;line-height:1.6;color:#0a0a0a;white-space:pre-wrap;">${esc(notes)}</p>
         </div>`
      : ""
  }
  <div style="margin-top:30px;">
    ${phone ? `<a href="tel:${esc(phone)}" style="display:inline-block;padding:14px 26px;background:#0a0a0a;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">Call ${esc(phone)}</a>` : ""}
    <a href="mailto:${esc(email)}" style="display:inline-block;margin-left:8px;padding:14px 26px;background:#0d7f79;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">Reply by email</a>
  </div>
</div>`;

    /* ── 2. Confirm to the homeowner ────────────────────────────── */
    const customerHtml = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:36px 32px;background:#fff;border-top:3px solid #0a0a0a;">
  <p style="margin:0 0 24px;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#96969e;">
    Watersound Origins &middot; Naturewalk &middot; Inlet Beach
  </p>
  <h1 style="margin:0 0 18px;font-size:26px;line-height:1.12;letter-spacing:-0.02em;color:#0a0a0a;">
    ${firstName ? `${esc(firstName)}, your walkthrough request is in.` : "Your walkthrough request is in."}
  </h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#56565c;">
    I'll confirm the exact time personally, usually the same day. Here's what I have:
  </p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#96969e;width:130px;">Day</td>
      <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:15px;color:#0a0a0a;">${esc(date || "To be confirmed")}</td>
    </tr>
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#96969e;">Window</td>
      <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:15px;color:#0a0a0a;">${esc(windowLabel)}</td>
    </tr>
    ${
      neighborhood
        ? `<tr>
             <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#96969e;">Property</td>
             <td style="padding:9px 0;border-bottom:1px solid #eceae5;font-size:15px;color:#0a0a0a;">${esc(address ? `${address}, ${neighborhood}` : neighborhood)}</td>
           </tr>`
        : ""
    }
  </table>
  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#56565c;">
    The walkthrough is free and takes about 30 minutes. I'll look at the property
    inside and out and tell you straight what it actually needs, even if that
    turns out to be less than you expected.
  </p>
  <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#0a0a0a;">
    Ryder Schilling<br />
    <span style="color:#56565c;">Coastal Home Management 30A</span>
  </p>
</div>`;

    await Promise.allSettled([
      resend.emails.send({
        from,
        to,
        subject: `Walkthrough request, ${who}${neighborhood ? ` (${neighborhood})` : ""}${date ? ` · ${date}` : ""}`,
        html: ownerHtml,
        replyTo: email,
      }),
      resend.emails.send({
        from,
        to: email,
        subject: "Your walkthrough request, Coastal Home Management 30A",
        html: customerHtml,
        replyTo,
      }),
    ]);

    return NextResponse.json({ ok: true, data: { emailed: true } });
  } catch (e) {
    // Never surface a failure here: the lead is already saved upstream, and
    // telling a homeowner their request failed when it didn't is worse than
    // a missing notification email.
    return NextResponse.json({
      ok: true,
      data: { emailed: false, note: e instanceof Error ? e.message : "unknown" },
    });
  }
}
