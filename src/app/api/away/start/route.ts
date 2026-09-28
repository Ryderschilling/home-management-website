import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { forwardLeadToDashboard } from "@/lib/server/forward-lead";

export const runtime = "nodejs";

/**
 * POST /api/away/start  -  "Start now" on page 2 of the Away on 30A funnel.
 * No payment. Collects what Ryder needs to set up a home, lands in CHM Ops as
 * a lead with a HIGH task to call them, emails Ryder the whole thing, and
 * confirms to the owner. Codes are NOT collected here on purpose: gate, door
 * and alarm codes go by phone, never through a web form or an inbox.
 */
const OWNER_FALLBACK = "coastalhomemanagement30a@gmail.com";

const PLANS: Record<string, string> = {
  essential: "Essential, every two weeks, $200/mo",
  weekly: "Home Watch, every week, $300/mo",
  unsure: "Not sure yet, wants Ryder's advice",
};
const STARTS: Record<string, string> = { asap: "As soon as possible", month: "Later this month", next: "Next month" };
const ACCESS: Record<string, string> = {
  lockbox: "Lockbox", keypad: "Keypad door code", key: "Key with a neighbor or manager", meet: "Will meet Ryder with a key", unsure: "Not sure yet",
};

const clean = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (clean(b.company)) return NextResponse.json({ ok: true }); // honeypot

    const name = clean(b.name, 100);
    const email = clean(b.email, 160).toLowerCase();
    const phone = clean(b.phone, 40);
    const address = clean(b.address, 200);
    const neighborhood = clean(b.neighborhood, 80);
    const plan = PLANS[clean(b.plan, 20)] ?? PLANS.unsure;
    const start = STARTS[clean(b.start, 20)] ?? STARTS.asap;
    const access = ACCESS[clean(b.access, 20)] ?? ACCESS.unsure;
    const pool = clean(b.pool, 5) === "yes";
    const irrigation = clean(b.irrigation, 5) === "yes";
    const away = clean(b.away, 300);
    const notes = clean(b.notes, 1000);
    const bestTime = clean(b.bestTime, 80);

    if (!name) return NextResponse.json({ ok: false, error: { message: "Add your name." } }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: { message: "Add a valid email." } }, { status: 400 });
    if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ ok: false, error: { message: "Add a mobile number so Ryder can call you." } }, { status: 400 });
    if (!address) return NextResponse.json({ ok: false, error: { message: "Add the address of your 30A home." } }, { status: 400 });

    const rows: Array<[string, string]> = [
      ["Plan", plan],
      ["Start", start],
      ["Name", name],
      ["Mobile", phone],
      ["Email", email],
      ["Address", address],
      ["Neighborhood", neighborhood || "Not given"],
      ["Pool", pool ? "Yes" : "No"],
      ["Irrigation", irrigation ? "Yes" : "No"],
      ["How to get in", access],
      ["Usually away", away || "Not given"],
      ["Best time to call", bestTime || "Any time"],
      ["Anything to know", notes || "Nothing"],
    ];
    const summary = `WANTS TO START NOW. ${rows.map(([k, v]) => `${k}: ${v}`).join(". ")}.`;

    const first = name.split(/\s+/)[0];
    const tasks: Promise<unknown>[] = [
      forwardLeadToDashboard({
        name,
        email,
        phone,
        community: neighborhood || null,
        source: "Away on 30A start now",
        message: summary,
        booked: true,
        intent: "buy",
        eventLabel: "start",
      }),
    ];

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    if (apiKey && from) {
      const resend = new Resend(apiKey);
      const to = process.env.BOOKING_NOTIFY_EMAIL || process.env.UPLOAD_NOTIFY_EMAIL || OWNER_FALLBACK;
      const table = `<table style="border-collapse:collapse;width:100%">${rows
        .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:12px;color:#96969e;width:140px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:15px">${esc(v)}</td></tr>`)
        .join("")}</table>`;
      tasks.push(
        resend.emails
          .send({
            from,
            to,
            replyTo: email,
            subject: `START NOW: ${name}, ${plan.split(",")[0]}${neighborhood ? ` (${neighborhood})` : ""}`,
            html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#0a0a0a">
  <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#96969e;margin:0 0 8px">Away on 30A, ready to start</p>
  <h1 style="font-size:22px;margin:0 0 18px">Call ${esc(first)} at ${esc(phone)} and set them up.</h1>${table}
  <p style="font-size:13px;color:#56565c;margin:16px 0 0">Get codes by phone. Also in CHM Ops under Leads, with a task.</p></div>`,
          })
          .catch((err) => console.error("[away/start] notify failed:", err))
      );
      tasks.push(
        resend.emails
          .send({
            from,
            to: email,
            replyTo: process.env.REPLY_TO_EMAIL || OWNER_FALLBACK,
            subject: `You're in, ${first}. I'll call you to get set up`,
            html: `<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;max-width:540px;margin:0 auto;padding:34px 30px;background:#fff;border-top:3px solid #0d7f79;color:#0a0a0a;">
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Hey ${esc(first)}, this is Ryder. Got everything, thank you!</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">I'll call you${bestTime ? ` (${esc(bestTime)})` : ""} to get your home set up and grab any codes over the phone. Nothing is charged until we've talked, and if you don't love your first month, it's free.</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Looking forward to it!</p>
  <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Ryder Schilling<br /><span style="color:#56565c;">Coastal Home Management 30A</span><br /><a href="tel:3094158793" style="color:#0d7f79;text-decoration:none;">(309) 415-8793</a></p></div>`,
            text: `Hey ${first}, this is Ryder. Got everything, thank you!\n\nI'll call you${bestTime ? ` (${bestTime})` : ""} to get your home set up and grab any codes over the phone. Nothing is charged until we've talked, and if you don't love your first month, it's free.\n\nLooking forward to it!\n\nRyder Schilling\nCoastal Home Management 30A\n(309) 415-8793`,
          })
          .catch((err) => console.error("[away/start] confirm failed:", err))
      );
    }
    await Promise.allSettled(tasks);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[away/start] failed:", err);
    return NextResponse.json({ ok: false, error: { message: "That did not go through. Try again, or call (309) 415-8793." } }, { status: 500 });
  }
}
