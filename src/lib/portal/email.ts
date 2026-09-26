/**
 * Portal emails through Resend. One branded template, plain words, big type.
 * Every send is best-effort: a mail failure is logged and never breaks the
 * action that triggered it.
 */
import { Resend } from "resend";

export const CHM = {
  name: "Coastal Home Management 30A",
  phone: "(309) 415-8793",
  phoneTel: "+13094158793",
  email: "coastalhomemanagement30a@gmail.com",
  site: "coastalhomemngt30a.com",
  owner: "Ryder Schilling",
} as const;

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://coastalhomemngt30a.com").replace(/\/$/, "");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type MailBlock =
  | { p: string }
  | { h: string }
  | { rows: Array<[string, string]> }
  | { code: string }
  | { button: { label: string; href: string } };

export function renderEmail(opts: { heading: string; blocks: MailBlock[]; preheader?: string }): string {
  const body = opts.blocks
    .map((b) => {
      if ("p" in b) return `<p style="margin:0 0 18px;font-size:17px;line-height:1.6;color:#0a0a0a;">${esc(b.p)}</p>`;
      if ("h" in b) return `<p style="margin:26px 0 10px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#56565c;">${esc(b.h)}</p>`;
      if ("code" in b)
        return `<p style="margin:8px 0 22px;font-size:40px;letter-spacing:0.28em;font-weight:700;color:#0d7f79;font-family:ui-monospace,Menlo,monospace;">${esc(b.code)}</p>`;
      if ("button" in b)
        return `<p style="margin:26px 0;"><a href="${b.button.href}" style="display:inline-block;background:#0d7f79;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:16px 28px;letter-spacing:0.04em;">${esc(b.button.label)}</a></p>`;
      if ("rows" in b)
        return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;width:100%;font-size:16px;line-height:1.5;">${b.rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px 12px 8px 0;color:#56565c;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:8px 0;color:#0a0a0a;">${esc(v)}</td></tr>`
          )
          .join("")}</table>`;
      return "";
    })
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f1;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(opts.preheader)}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f1;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-top:3px solid #0d7f79;">
<tr><td style="padding:34px 36px 0;">
<p style="margin:0 0 26px;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#96969e;">Coastal Home Management 30A</p>
<h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.01em;color:#0a0a0a;">${esc(opts.heading)}</h1>
${body}
</td></tr>
<tr><td style="padding:10px 36px 34px;">
<p style="margin:0;font-size:14px;line-height:1.6;color:#56565c;">Questions? Text or call ${CHM.owner} at <a href="tel:${CHM.phoneTel}" style="color:#0d7f79;text-decoration:none;">${CHM.phone}</a>, or reply to this email.</p>
<p style="margin:14px 0 0;font-size:12px;color:#96969e;">${CHM.name} · ${CHM.site}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendPortalEmail(opts: {
  to: string;
  subject: string;
  heading: string;
  blocks: MailBlock[];
  preheader?: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!key || !from) {
    console.warn("[portal email] RESEND_API_KEY or FROM_EMAIL missing; would have sent:", opts.subject, "to", opts.to);
    return false;
  }
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: renderEmail(opts),
      replyTo: opts.replyTo || process.env.REPLY_TO_EMAIL || CHM.email,
    });
    return true;
  } catch (e) {
    console.error("[portal email] send failed", opts.subject, e);
    return false;
  }
}

/** Ping Ryder. Same template, his inbox. */
export async function notifyRyder(subject: string, heading: string, blocks: MailBlock[]): Promise<void> {
  const to = process.env.PORTAL_NOTIFY_EMAIL || CHM.email;
  await sendPortalEmail({ to, subject: `[Portal] ${subject}`, heading, blocks });
}
