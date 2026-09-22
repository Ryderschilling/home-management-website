import { Resend } from "resend";

/**
 * The instant "thanks, tell me a little more" email every new lead gets the
 * moment they submit (added 9/21/26 for the Away on 30A Meta campaign).
 *
 * Ryder approved this as a standing template, so it sends automatically. Keep
 * it in his voice: casual, short, one ask, warm assumptive close. No em-dashes.
 * No insurance language. A text version comes later once a Twilio number is
 * registered; until then this email is the 5-minute follow-up.
 *
 * Best effort: a failure here is logged and swallowed so it never breaks a form.
 */

export type LeadWelcomeInput = {
  firstName?: string | null;
  email: string;
  /** Optional line confirming what they asked for, e.g. the walkthrough slot. */
  requestLine?: string | null;
};

const PHONE_DISPLAY = "(309) 415-8793";
const PHONE_TEL = "3094158793";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildLeadWelcome({ firstName, requestLine }: Omit<LeadWelcomeInput, "email">) {
  const name = (firstName || "").trim();
  const hey = name ? `Hey ${esc(name)},` : "Hey there,";
  const asks = [
    "Gate code, or how I get in (lockbox, keypad, key with a neighbor)",
    "How long the house usually sits empty",
    "Anything already on your mind: pool, irrigation, a past leak, an AC that acts up",
    "Best number to text you",
  ];

  const subject = name ? `Got it, ${name}. Quick question about your 30A home` : "Got it. Quick question about your 30A home";

  const html = `<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;max-width:540px;margin:0 auto;padding:34px 30px;background:#ffffff;border-top:3px solid #0d7f79;color:#0a0a0a;">
  <p style="margin:0 0 22px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#96969e;">Coastal Home Management 30A</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">${hey}</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Thanks for reaching out! This is Ryder. I live right here in Watersound Origins and I'm the one who will be checking on your home.</p>
  ${requestLine ? `<p style="margin:0 0 16px;padding:14px 16px;background:#f4f4f1;border-left:2px solid #0d7f79;font-size:15px;line-height:1.6;">${esc(requestLine)}</p>` : ""}
  <p style="margin:0 0 10px;font-size:16px;line-height:1.65;">So I show up ready, can you hit reply and tell me:</p>
  <ol style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.7;color:#333;">
    ${asks.map((a) => `<li style="margin:0 0 4px;">${esc(a)}</li>`).join("")}
  </ol>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Even one line back helps. Looking forward to meeting you!</p>
  <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Ryder Schilling<br /><span style="color:#56565c;">Coastal Home Management 30A</span><br /><a href="tel:${PHONE_TEL}" style="color:#0d7f79;text-decoration:none;">${PHONE_DISPLAY}</a></p>
</div>`;

  const text = [
    hey,
    "",
    "Thanks for reaching out! This is Ryder. I live right here in Watersound Origins and I'm the one who will be checking on your home.",
    requestLine ? `\n${requestLine}` : "",
    "",
    "So I show up ready, can you hit reply and tell me:",
    ...asks.map((a, i) => `${i + 1}. ${a}`),
    "",
    "Even one line back helps. Looking forward to meeting you!",
    "",
    "Ryder Schilling",
    "Coastal Home Management 30A",
    PHONE_DISPLAY,
  ].join("\n");

  return { subject, html, text };
}

export async function sendLeadWelcome(input: LeadWelcomeInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!apiKey || !from || !input.email) return false;
  const { subject, html, text } = buildLeadWelcome(input);
  try {
    await new Resend(apiKey).emails.send({
      from,
      to: input.email,
      replyTo: process.env.REPLY_TO_EMAIL || "coastalhomemanagement30a@gmail.com",
      subject,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("[lead-welcome] send failed:", err);
    return false;
  }
}
