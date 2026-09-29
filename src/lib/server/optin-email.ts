import { Resend } from "resend";

/**
 * The email an Away on 30A opt-in gets right away. They asked, so it is
 * transactional and sends instantly. Ryder's voice: short, plain, warm.
 * Never promise a call. No em-dashes, no insurance language, never
 * "inspection". The CHM Ops follow-up sequence takes over from here.
 */
const SITE = () => (process.env.APP_URL || "https://coastalhomemngt30a.com").replace(/\/$/, "");
const PHONE_DISPLAY = "(309) 415-8793";

export async function sendOptInEmail(email: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!apiKey || !from) return false;
  const utm = "utm_source=email&utm_medium=optin&utm_campaign=away30a";
  const services = `${SITE()}/away-on-30a/next?${utm}`;
  const report = `${SITE()}/away-on-30a/report?${utm}`;

  const subject = "Thanks for reaching out about your 30A home";
  const html = `<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;max-width:540px;margin:0 auto;padding:34px 30px;background:#ffffff;border-top:3px solid #0d7f79;color:#0a0a0a;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
    <td style="vertical-align:middle;padding-right:12px;"><img src="${SITE()}/chm-logo-email.png" width="40" height="40" alt="CHM" style="display:block;border:0;border-radius:4px;" /></td>
    <td style="vertical-align:middle;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#56565c;">Coastal Home Management 30A</td>
  </tr></table>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Hey, this is Ryder. Thanks for reaching out about your home on 30A. I'll be in touch.</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">In the meantime, here's <a href="${services}" style="color:#0d7f79;">what we do for 30A homes</a>, and a <a href="${report}" style="color:#0d7f79;">real visit report</a> so you can see exactly what owners get after every walkthrough.</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">If you have a question before then, just reply to this email.</p>
  <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Ryder Schilling<br /><span style="color:#56565c;">Coastal Home Management 30A</span><br /><a href="tel:3094158793" style="color:#0d7f79;text-decoration:none;">${PHONE_DISPLAY}</a></p>
</div>`;
  const text = `Hey, this is Ryder. Thanks for reaching out about your home on 30A. I'll be in touch.\n\nIn the meantime, here's what we do for 30A homes: ${services}\nAnd a real visit report so you can see exactly what owners get: ${report}\n\nIf you have a question before then, just reply to this email.\n\nRyder Schilling\nCoastal Home Management 30A\n${PHONE_DISPLAY}`;

  try {
    await new Resend(apiKey).emails.send({
      from,
      to: email,
      replyTo: process.env.REPLY_TO_EMAIL || "coastalhomemanagement30a@gmail.com",
      subject,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("[optin-email] send failed:", err);
    return false;
  }
}
