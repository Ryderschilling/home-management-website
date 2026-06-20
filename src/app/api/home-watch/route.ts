import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Who gets the instant "new lead" email.
 * Defaults to Ryder's inbox + the business inbox so a lead is never missed.
 * Override anytime by setting LEAD_NOTIFY_EMAIL (comma-separated) in Vercel env.
 */
const NOTIFY_EMAILS: string[] = (
  process.env.LEAD_NOTIFY_EMAIL ||
  "Ryderscott33@icloud.com,Coastalhomemanagement30a@gmail.com"
)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function safe(v: unknown): string {
  return String(v ?? "").trim();
}

function buildOwnerEmail(data: {
  name: string;
  email: string;
  phone: string;
  neighborhood: string;
  message: string;
  source: string;
}): string {
  const ts = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const row = (label: string, value: string) =>
    value
      ? `<tr>
          <td style="padding:8px 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(0,0,0,0.4);width:130px;vertical-align:top;">${label}</td>
          <td style="padding:8px 0;font-size:14px;color:#0b0b0b;line-height:1.5;">${value}</td>
         </tr>`
      : "";

  const digits = data.phone.replace(/\D/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>New Lead — Home Watch</title>
</head>
<body style="margin:0;padding:0;background:#f0efed;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0efed;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#fafaf8;border-top:3px solid #0b0b0b;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 0;">
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c9b89a;font-weight:700;">
                New Lead — Free Home Check
              </p>
              <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0b0b0b;letter-spacing:-0.02em;">
                ${data.name || "New inquiry"}
              </h1>
              <p style="margin:0;font-size:13px;color:rgba(0,0,0,0.4);">${ts} CT</p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:24px 36px;">
              <div style="height:1px;background:rgba(0,0,0,0.08);margin-bottom:20px;"></div>
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                ${row("Name", data.name)}
                ${row("Email", `<a href="mailto:${data.email}" style="color:#0b0b0b;">${data.email}</a>`)}
                ${row("Phone", digits ? `<a href="tel:${digits}" style="color:#0b0b0b;">${data.phone}</a>` : "")}
                ${row("Neighborhood", data.neighborhood)}
                ${row("Message", data.message ? data.message.replace(/\n/g, "<br/>") : "")}
                ${row("Source", data.source)}
              </table>
            </td>
          </tr>

          <!-- Quick actions -->
          <tr>
            <td style="padding:0 36px 28px;">
              <div style="height:1px;background:rgba(0,0,0,0.08);margin-bottom:20px;"></div>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="mailto:${data.email}?subject=Your%20free%20home%20check%20%E2%80%94%20Coastal%20Home%20Management&body=Hi%20${encodeURIComponent(
                      (data.name || "").split(" ")[0]
                    )}%2C%0A%0AThanks%20for%20reaching%20out.%20I%27d%20love%20to%20come%20take%20a%20look%20at%20your%20place.%20"
                       style="display:inline-block;background:#0b0b0b;color:#fafaf8;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:11px 20px;border-radius:6px;">
                      Reply
                    </a>
                  </td>
                  ${
                    digits
                      ? `<td style="padding-right:10px;">
                    <a href="sms:${digits}"
                       style="display:inline-block;background:transparent;color:#0b0b0b;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:10px 20px;border:1px solid rgba(0,0,0,0.2);border-radius:6px;">
                      Text
                    </a>
                  </td>
                  <td>
                    <a href="tel:${digits}"
                       style="display:inline-block;background:transparent;color:#0b0b0b;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:10px 20px;border:1px solid rgba(0,0,0,0.2);border-radius:6px;">
                      Call
                    </a>
                  </td>`
                      : ""
                  }
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 36px 20px;background:#f0efed;">
              <p style="margin:0;font-size:11px;color:rgba(0,0,0,0.3);line-height:1.5;">
                Sent from the CHM home-watch landing page · coastalhomemngt30a.com/home-watch
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildLeadConfirmation(firstName: string): string {
  const hi = firstName ? `Hi ${firstName},` : "Hi there,";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-top:3px solid #0b0b0b;">
        <tr><td style="padding:36px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#0b0b0b;letter-spacing:-0.02em;">${hi}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:rgba(0,0,0,0.7);">
            Thanks for reaching out about your home. I got your message and I'll be in touch personally
            within 24 hours to set up a free walkthrough.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:rgba(0,0,0,0.7);">
            I'm local, I'm insured, and I treat every home here like it's my own. If anything comes up
            in the meantime, just reply to this email.
          </p>
          <p style="margin:24px 0 0;font-size:15px;line-height:1.65;color:#0b0b0b;">
            Talk soon,<br/>Ryder<br/>
            <span style="color:rgba(0,0,0,0.5);font-size:13px;">Coastal Home Management 30A</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const name = safe(body.name);
    const email = safe(body.email).toLowerCase();
    const phone = safe(body.phone);
    const neighborhood = safe(body.neighborhood);
    const message = safe(body.message);
    const source = safe(body.source) || "/home-watch";

    // Validation — name + phone are required; email is optional
    if (!name) {
      return NextResponse.json(
        { ok: false, error: { message: "Please enter your name." } },
        { status: 400 }
      );
    }
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: { message: "Please enter your phone number so we can reach you." } },
        { status: 400 }
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: { message: "That email doesn't look right." } },
        { status: 400 }
      );
    }

    // 1) Instant owner notification — this is the must-have.
    await resend.emails.send({
      from: env.FROM_EMAIL,
      to: NOTIFY_EMAILS,
      replyTo: email || env.REPLY_TO_EMAIL || undefined,
      subject: `New Lead — ${name}${neighborhood ? ` (${neighborhood})` : ""}`,
      html: buildOwnerEmail({ name, email, phone, neighborhood, message, source }),
    });

    // 2) Confirmation to the lead — don't let a failure here block the response.
    if (email) {
      try {
        await resend.emails.send({
          from: env.FROM_EMAIL,
          to: email,
          replyTo: env.REPLY_TO_EMAIL || undefined,
          subject: "Got your message — Coastal Home Management 30A",
          html: buildLeadConfirmation(name.split(" ")[0]),
        });
      } catch (e) {
        console.error("[CHM] Lead confirmation email failed (non-blocking):", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[CHM] Home-watch lead failed:", e);
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Failed to send. Please try again." } },
      { status: 500 }
    );
  }
}
