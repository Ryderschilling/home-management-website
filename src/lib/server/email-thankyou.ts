// src/lib/server/email-thankyou.ts
import { Resend } from "resend";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing ${name}`);
  return v.trim();
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildThankYouEmailHtml(opts: {
  customerName: string;
  productLabel: string;
  reviewUrl: string;
  upsellUrl: string;
  supportEmail: string;
  logoUrl?: string;
}) {
  const name = escapeHtml(opts.customerName || "there");
  const product = escapeHtml(opts.productLabel || "your service");
  const reviewUrl = opts.reviewUrl;
  const upsellUrl = opts.upsellUrl;
  const supportEmail = escapeHtml(opts.supportEmail);
  const logoUrl = opts.logoUrl;

  // Simple, clean, mobile-friendly (inline CSS for Gmail/iOS)
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Thank you</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0f14;color:#e7eef7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <div style="display:flex;align-items:center;justify-content:center;margin-bottom:18px;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="Coastal Home Management" width="140" style="display:block;max-width:140px;height:auto;opacity:0.98;" />`
            : `<div style="font-weight:700;letter-spacing:0.14em;font-size:12px;opacity:0.9;">COASTAL HOME MANAGEMENT 30A</div>`
        }
      </div>

      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);border-radius:18px;padding:22px;box-shadow:0 14px 40px rgba(0,0,0,0.45);">
        <div style="font-size:22px;line-height:1.25;font-weight:700;margin:0 0 10px 0;text-align:left;">
          Thank you — your installation is complete
        </div>

        <p style="margin:0 0 14px 0;opacity:0.88;line-height:1.6;">
          Hi ${name},
        </p>

        <p style="margin:0 0 16px 0;opacity:0.88;line-height:1.6;">
          Thanks again for choosing Coastal Home Management 30A. Your <strong style="color:#ffffff;">${product}</strong> is complete.
        </p>

        <div style="height:1px;background:rgba(255,255,255,0.10);margin:18px 0;"></div>

        <div style="font-size:16px;font-weight:700;margin:0 0 10px 0;">
          Would you leave a quick review?
        </div>

        <div style="margin:0 0 18px 0;">
          <a href="${reviewUrl}" style="display:inline-block;background:#ffffff;color:#0b0f14;text-decoration:none;padding:12px 16px;border-radius:999px;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">
            Leave a Google review
          </a>
        </div>

        <div style="font-size:16px;font-weight:700;margin:0 0 10px 0;">
          Want ongoing home care?
        </div>

        <p style="margin:0 0 14px 0;opacity:0.88;line-height:1.6;">
          We offer recurring second-home check-ins and concierge services. Learn more here:
        </p>

        <div style="margin:0 0 18px 0;">
          <a href="${upsellUrl}" style="display:inline-block;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.18);color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:999px;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">
            View services
          </a>
        </div>

        <div style="height:1px;background:rgba(255,255,255,0.10);margin:18px 0;"></div>

        <p style="margin:0;opacity:0.85;line-height:1.6;">
          If you have any questions, just reply to this email or reach us at
          <a href="mailto:${supportEmail}" style="color:#9fd3ff;text-decoration:underline;">${supportEmail}</a>.
        </p>

        <p style="margin:16px 0 0 0;opacity:0.85;">
          — Coastal Home Management 30A
        </p>
      </div>

      <div style="text-align:center;margin-top:14px;font-size:12px;opacity:0.55;">
        © ${new Date().getFullYear()} Coastal Home Management 30A
      </div>
    </div>
  </body>
</html>`;
}

export async function sendThankYouEmail(opts: {
  to: string;
  customerName: string;
  productLabel: string;
}) {
  const key = requireEnv("RESEND_API_KEY");
  const from = requireEnv("FROM_EMAIL"); // e.g. "Coastal Home Management <no-reply@yourdomain.com>"
  const replyTo = process.env.REPLY_TO_EMAIL?.trim();
  const reviewUrl = requireEnv("GBP_REVIEW_URL");
  const upsellUrl = requireEnv("UPSELL_URL");

  const appUrl = process.env.APP_URL?.trim();
  const logoUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/chm-logo.png` : undefined;

  const html = buildThankYouEmailHtml({
    customerName: opts.customerName,
    productLabel: opts.productLabel,
    reviewUrl,
    upsellUrl,
    supportEmail: replyTo || "coastalhomemanagement30a@gmail.com",
    logoUrl,
  });

  const resend = new Resend(key);

  await resend.emails.send({
    from,
    to: opts.to,
    subject: "Thank you — your installation is complete",
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}