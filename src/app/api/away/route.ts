import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { forwardLeadToDashboard } from "@/lib/server/forward-lead";
import { sendLeadWelcome } from "@/lib/server/lead-welcome";

export const runtime = "nodejs";

/**
 * POST /api/away
 *
 * The booking flow on /away-on-30a (the Meta ads landing page, 9/21/26).
 * 1. Lead goes to CHM Ops through the intake bridge (single source of truth).
 * 2. Ryder gets the full request by email.
 * 3. The homeowner gets the instant welcome email (src/lib/server/lead-welcome.ts).
 * Walkthroughs are offered on Tuesdays and Thursdays only; Ryder confirms the
 * exact time by text. Nothing is charged.
 */

const OWNER_FALLBACK = "coastalhomemanagement30a@gmail.com";

const WINDOWS: Record<string, string> = {
  morning: "Morning (8am to 12pm)",
  afternoon: "Afternoon (12pm to 5pm)",
};
const MODES: Record<string, string> = {
  person: "Meet in person at the home",
  facetime: "Walk it together on FaceTime",
  solo: "Owner will not be there, walk it and send the report",
};

function clean(v: unknown, max = 300): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function prettyDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (clean(body.company)) return NextResponse.json({ ok: true }); // honeypot

    const firstName = clean(body.firstName, 80);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 40);
    const address = clean(body.address, 200);
    const neighborhood = clean(body.neighborhood, 80);
    const date = clean(body.date, 10);
    const windowId = clean(body.window, 20);
    const modeId = clean(body.mode, 20);
    const away = clean(body.away, 400);
    const utm = clean(body.utm, 300);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: { message: "Add a valid email so the report has somewhere to go." } }, { status: 400 });
    }
    if (!address) {
      return NextResponse.json({ ok: false, error: { message: "Add the address of your 30A home." } }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ ok: false, error: { message: "Add a mobile number so Ryder can confirm the time." } }, { status: 400 });
    }

    const dayLabel = prettyDate(date);
    const day = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (date && day !== 2 && day !== 4) {
      return NextResponse.json({ ok: false, error: { message: "Pick a Tuesday or Thursday." } }, { status: 400 });
    }
    const windowLabel = WINDOWS[windowId] || "No window picked";
    const modeLabel = MODES[modeId] || "Not picked";

    const summary = [
      "Away on 30A free walkthrough request.",
      `Address: ${address}${neighborhood ? ` (${neighborhood})` : ""}.`,
      `Requested: ${dayLabel || "no day picked"}, ${windowLabel}.`,
      `How: ${modeLabel}.`,
      away ? `Usually away: ${away}.` : "",
      utm ? `Ad: ${utm}.` : "",
    ].filter(Boolean).join(" ");

    await forwardLeadToDashboard({
      name: firstName || null,
      email,
      phone,
      community: neighborhood || null,
      source: utm ? "Meta ads /away-on-30a" : "Website /away-on-30a",
      message: summary,
    });

    const whenShort = dayLabel ? `${dayLabel}, ${windowId === "afternoon" ? "afternoon" : windowId === "morning" ? "morning" : "time to be set"}` : "";
    const modeShort = modeId === "facetime" ? " on FaceTime" : modeId === "person" ? " in person" : modeId === "solo" ? ", and I'll send you the photo report after" : "";
    const requestLine = whenShort ? `You're down for a free walkthrough ${whenShort}${modeShort}. I'll text you to lock in the exact time.` : "Your free walkthrough request is in.";

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    const tasks: Promise<unknown>[] = [sendLeadWelcome({ firstName, email, requestLine })];

    if (apiKey && from) {
      const to = process.env.BOOKING_NOTIFY_EMAIL || process.env.UPLOAD_NOTIFY_EMAIL || OWNER_FALLBACK;
      const rows: Array<[string, string]> = [
        ["Name", firstName || "Not given"],
        ["Mobile", phone],
        ["Email", email],
        ["Address", address],
        ["Neighborhood", neighborhood || "Not given"],
        ["Day", dayLabel || "Not picked"],
        ["Window", windowLabel],
        ["How", modeLabel],
        ["Usually away", away || "Not given"],
        ["Ad", utm || "Organic / direct"],
      ];
      const html = `<div style="font-family:system-ui,sans-serif;max-width:540px;color:#0a0a0a">
  <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#96969e;margin:0 0 8px">Away on 30A walkthrough</p>
  <h1 style="font-size:22px;margin:0 0 18px">Text ${esc(firstName || "them")} at ${esc(phone)} to confirm.</h1>
  <table style="border-collapse:collapse;width:100%">${rows
    .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:12px;color:#96969e;width:120px">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:15px">${esc(v)}</td></tr>`)
    .join("")}</table>
  <p style="font-size:13px;color:#56565c;margin:16px 0 0">They already got the welcome email asking for access, empty stretches, worries and best number. Also in CHM Ops under Leads.</p>
</div>`;
      tasks.push(
        new Resend(apiKey).emails
          .send({ from, to, replyTo: email, subject: `Walkthrough: ${firstName || email}${dayLabel ? `, ${dayLabel}` : ""}${neighborhood ? ` (${neighborhood})` : ""}`, html })
          .catch((err) => console.error("[away] notify failed:", err))
      );
    }
    await Promise.allSettled(tasks);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[away] failed:", err);
    return NextResponse.json({ ok: false, error: { message: "That did not go through. Try again, or call (309) 415-8793." } }, { status: 500 });
  }
}
