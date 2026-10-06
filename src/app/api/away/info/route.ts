import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { forwardLeadToDashboard } from "@/lib/server/forward-lead";
import { sendCapiEvent } from "@/lib/server/metaCapi";

export const runtime = "nodejs";

/**
 * POST /api/away/info  -  the optional "tell us about your home" form on page
 * 2 of Away on 30A. Updates the same lead in CHM Ops (the dashboard matches on
 * email and fills in name, phone and neighborhood) and emails Ryder a summary.
 * No confirmation email to the owner: they already got one at opt-in.
 */
const OWNER_FALLBACK = "coastalhomemanagement30a@gmail.com";
const EMPTY: Record<string, string> = {
  most: "Most of the year",
  half: "About half the year",
  season: "A few months at a time",
  rental: "It's a rental",
};

const clean = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (clean(b.company)) return NextResponse.json({ ok: true }); // honeypot

    const email = clean(b.email, 160).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: { message: "Add your email so this lands with the right person." } }, { status: 400 });
    }
    const name = clean(b.name, 100);
    const phone = clean(b.phone, 40);
    const neighborhood = clean(b.neighborhood, 80);
    const empty = EMPTY[clean(b.empty, 20)] ?? "";
    const needs = Array.isArray(b.needs) ? b.needs.map((n) => clean(n, 60)).filter(Boolean).slice(0, 10) : [];
    const notes = clean(b.notes, 1000);

    const rows: Array<[string, string]> = [
      ["Name", name || "Not given"],
      ["Mobile", phone || "Not given"],
      ["Email", email],
      ["Home", neighborhood || "Not given"],
      ["Empty", empty || "Not given"],
      ["Wants", needs.length ? needs.join(", ") : "Not given"],
      ["Notes", notes || "Nothing"],
    ];
    const summary = `Home info from page 2. ${rows.filter(([k]) => k !== "Email").map(([k, v]) => `${k}: ${v}`).join(". ")}.`;

    const tasks: Promise<unknown>[] = [
      forwardLeadToDashboard({
        name: name || null,
        email,
        phone: phone || null,
        community: neighborhood || null,
        source: "Away on 30A home info",
        message: summary,
        eventLabel: "info",
      }, { clientAttr: b.attr }),
    ];

    // Page 2 hands Meta the name and phone too (9/29/26 audit): better match
    // quality for this lead and for the Purchase CHM Ops sends when they pay.
    // "Contact", never a second "Lead", so the ad set's lead count stays honest.
    tasks.push(sendCapiEvent({ eventName: "Contact", email, phone: phone || null, firstName: name.split(/\s+/)[0] || null }));

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    if (apiKey && from) {
      const to = process.env.BOOKING_NOTIFY_EMAIL || process.env.UPLOAD_NOTIFY_EMAIL || OWNER_FALLBACK;
      const table = `<table style="border-collapse:collapse;width:100%">${rows
        .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:12px;color:#96969e;width:110px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:15px">${esc(v)}</td></tr>`)
        .join("")}</table>`;
      tasks.push(
        new Resend(apiKey).emails
          .send({
            from,
            to,
            replyTo: email,
            subject: `Away on 30A: ${name || email}${neighborhood ? ` (${neighborhood})` : ""} sent home info`,
            html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#0a0a0a">
  <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#96969e;margin:0 0 8px">Away on 30A, page 2</p>
  <h1 style="font-size:20px;margin:0 0 18px">${esc(name || email)} told you about their home.</h1>${table}
  <p style="font-size:13px;color:#56565c;margin:16px 0 0">Also on their lead in CHM Ops.</p></div>`,
          })
          .catch((err) => console.error("[away/info] notify failed:", err))
      );
    }
    await Promise.allSettled(tasks);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[away/info] failed:", err);
    return NextResponse.json({ ok: false, error: { message: "That did not go through. Try again." } }, { status: 500 });
  }
}
