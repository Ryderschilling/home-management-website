import { Resend } from "resend";

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing ${key}`);
  return v;
}

export async function sendPipePhotoEmail(opts: {
  subject: string;
  html: string;
  attachmentName: string;
  attachmentBase64: string;
}) {
  const to = mustEnv("UPLOAD_NOTIFY_EMAIL");
  const from = mustEnv("FROM_EMAIL");
  const key = mustEnv("RESEND_API_KEY");

  const resend = new Resend(key);

  await resend.emails.send({
    from,
    to,
    subject: opts.subject,
    html: opts.html,
    replyTo: process.env.REPLY_TO_EMAIL || undefined,
    attachments: [
      { filename: opts.attachmentName, content: opts.attachmentBase64 },
    ],
  });
}

export async function sendCustomerThankYouEmail(opts: {
  to: string;
  name?: string;
}) {
  const key = mustEnv("RESEND_API_KEY");
  const from = mustEnv("FROM_EMAIL");

  const gbp = process.env.GBP_REVIEW_URL || "";
  const upsell = process.env.UPSELL_URL || "";
  const replyTo = process.env.REPLY_TO_EMAIL || undefined;

  const name = (opts.name || "").trim();
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const subject = "Thank you — your installation is complete";

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.55; color: #111;">
      <p>${greeting}</p>
      <p>Thanks again for choosing Coastal Home Management 30A. Your artificial rock installation is complete.</p>

      ${
        gbp
          ? `
        <p style="margin: 18px 0 8px;"><strong>Would you leave a quick review?</strong></p>
        <p><a href="${gbp}" target="_blank" rel="noreferrer">Leave a Google review</a></p>
      `
          : ""
      }

      ${
        upsell
          ? `
        <p style="margin: 18px 0 8px;"><strong>Want ongoing home care?</strong></p>
        <p>We offer recurring second-home check-ins and concierge services. Learn more here:</p>
        <p><a href="${upsell}" target="_blank" rel="noreferrer">View services</a></p>
      `
          : ""
      }

      <p style="margin-top: 18px;">If you have any questions, just reply to this email.</p>
      <p>— Coastal Home Management 30A</p>
    </div>
  `;

  const resend = new Resend(key);

  await resend.emails.send({
    from,
    to: opts.to,
    subject,
    html,
    replyTo,
  });
}