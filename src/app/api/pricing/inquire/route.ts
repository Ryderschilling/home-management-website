import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

const resend = new Resend(env.RESEND_API_KEY);

const OWNER_EMAIL = "Coastalhomemanagement30a@gmail.com";

function safe(v: unknown): string {
  return String(v ?? "").trim();
}

const TIER_COLORS: Record<string, { accent: string; label: string }> = {
  bronze: { accent: "#cd7f32", label: "Bronze — Essential Watch" },
  silver: { accent: "#c0c0c0", label: "Silver — Home Watch" },
  gold:   { accent: "#d4af37", label: "Gold — Coastal Elite" },
};

function buildOwnerEmail(data: {
  plan: string;
  tier: string;
  price: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
}): string {
  const tier = TIER_COLORS[data.tier] ?? { accent: "#888", label: data.plan };
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>New Pricing Inquiry</title>
</head>
<body style="margin:0;padding:0;background:#f0efed;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0efed;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#fafaf8;border-top:3px solid ${tier.accent};">

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 0;">
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${tier.accent};font-weight:700;">
                New Pricing Inquiry
              </p>
              <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0b0b0b;letter-spacing:-0.02em;">
                ${data.name}
              </h1>
              <p style="margin:0;font-size:13px;color:rgba(0,0,0,0.4);">${ts} CT</p>
            </td>
          </tr>

          <!-- Plan badge -->
          <tr>
            <td style="padding:20px 36px 0;">
              <div style="display:inline-block;padding:6px 16px;border-radius:100px;background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.08);">
                <span style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${tier.accent};">
                  ${tier.label} — $${data.price}/mo
                </span>
              </div>
            </td>
          </tr>

          <!-- Details table -->
          <tr>
            <td style="padding:24px 36px;">
              <div style="height:1px;background:rgba(0,0,0,0.08);margin-bottom:20px;"></div>
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                ${row("Name", data.name)}
                ${row("Email", `<a href="mailto:${data.email}" style="color:${tier.accent};text-decoration:none;">${data.email}</a>`)}
                ${row("Phone", `<a href="tel:${data.phone.replace(/\D/g, "")}" style="color:${tier.accent};text-decoration:none;">${data.phone}</a>`)}
                ${row("Plan", tier.label)}
                ${row("Price", `$${data.price}/month`)}
                ${data.address ? row("Property", data.address) : ""}
                ${data.message ? row("Message", data.message.replace(/\n/g, "<br/>")) : ""}
              </table>
            </td>
          </tr>

          <!-- Quick reply buttons -->
          <tr>
            <td style="padding:0 36px 28px;">
              <div style="height:1px;background:rgba(0,0,0,0.08);margin-bottom:20px;"></div>
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(0,0,0,0.4);">
                Quick Actions
              </p>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(tier.label)} Inquiry&body=Hi ${encodeURIComponent(data.name)},%0A%0AThanks for your interest in the ${encodeURIComponent(tier.label)} plan.%0A%0A"
                       style="display:inline-block;background:#0b0b0b;color:#fafaf8;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:11px 20px;border-radius:6px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
                      Reply to ${data.name.split(" ")[0]}
                    </a>
                  </td>
                  <td>
                    <a href="tel:${data.phone.replace(/\D/g, "")}"
                       style="display:inline-block;background:transparent;color:#0b0b0b;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:10px 20px;border:1px solid rgba(0,0,0,0.2);border-radius:6px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
                      Call ${data.phone}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 36px 20px;background:#f0efed;">
              <p style="margin:0;font-size:11px;color:rgba(0,0,0,0.3);line-height:1.5;">
                Sent from the CHM pricing page · coastalhomemanagement30a.com/pricing
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const plan    = safe(body.plan);
    const tier    = safe(body.tier).toLowerCase();
    const price   = Number(body.price) || 0;
    const name    = safe(body.name);
    const email   = safe(body.email).toLowerCase();
    const phone   = safe(body.phone);
    const address = safe(body.address);
    const message = safe(body.message);

    // Validation
    if (!name)  return NextResponse.json({ ok: false, error: { message: "Name is required" } }, { status: 400 });
    if (!email) return NextResponse.json({ ok: false, error: { message: "Email is required" } }, { status: 400 });
    if (!phone) return NextResponse.json({ ok: false, error: { message: "Phone is required" } }, { status: 400 });
    if (!plan)  return NextResponse.json({ ok: false, error: { message: "Plan is required" } }, { status: 400 });

    const tierLabel = TIER_COLORS[tier]?.label ?? plan;

    // Send owner notification email
    await resend.emails.send({
      from: env.FROM_EMAIL,
      to: OWNER_EMAIL,
      replyTo: email,
      subject: `New Inquiry: ${tierLabel} — ${name}`,
      html: buildOwnerEmail({ plan, tier, price, name, email, phone, address, message }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[CHM] Pricing inquiry email failed:", e);
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Failed to send inquiry" } },
      { status: 500 }
    );
  }
}
