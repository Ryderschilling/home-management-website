import { Resend } from "resend";

export async function sendThankYouEmail(opts: {
  to: string;
  name: string;
  gbpReviewUrl: string;
  upsellUrl: string;
}) {
  const key = process.env.RESEND_API_KEY as string;
  const from = process.env.FROM_EMAIL as string;
  const replyTo = process.env.REPLY_TO_EMAIL as string;

  if (!key) throw new Error("Missing RESEND_API_KEY");
  if (!from) throw new Error("Missing FROM_EMAIL");
  if (!replyTo) throw new Error("Missing REPLY_TO_EMAIL");
  if (!opts.gbpReviewUrl) throw new Error("Missing GBP_REVIEW_URL");
  if (!opts.upsellUrl) throw new Error("Missing UPSELL_URL");

  const resend = new Resend(key);

  const subject = "Thank you — quick favor?";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <p>Hi ${escapeHtml(opts.name)},</p>
      <p>Thank you for choosing Coastal Home Management 30A. Your installation is complete.</p>

      <p><strong>Could you leave us a quick review?</strong> It helps us a lot:</p>
      <p><a href="${opts.gbpReviewUrl}">${opts.gbpReviewUrl}</a></p>

      <p>If you'd like proactive second-home care (weekly checks, storm prep, concierge), you can see options here:</p>
      <p><a href="${opts.upsellUrl}">${opts.upsellUrl}</a></p>

      <p>Thank you again,<br/>Coastal Home Management 30A</p>
    </div>
  `;

  await resend.emails.send({
    from,
    to: opts.to,
    reply_to: replyTo,
    subject,
    html,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return c;
    }
  });
}