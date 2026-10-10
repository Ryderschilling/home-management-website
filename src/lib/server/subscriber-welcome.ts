import { Resend } from "resend";

/**
 * The one email a new email-list signup gets (added 10/10/26). Ryder's call:
 * no offer, no walkthrough pitch. A short "here's what you'll get" and a story
 * card about who he is, because the story is what people connect to.
 *
 * Voice: casual, Ryder in first person. No em-dashes. No insurance language.
 * Best effort: a failure is logged and swallowed so it never breaks signup.
 */

const SITE = "https://coastalhomemngt30a.com";
const PHONE_DISPLAY = "(309) 415-8793";
const PHONE_TEL = "3094158793";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export type SubscriberWelcomeInput = {
  email: string;
  firstName?: string | null;
  storm: boolean;
  unsubToken: string;
};

const STORY = [
  "I'm Ryder, the founder. I live in Watersound Origins, a few minutes from most of the homes we look after.",
  "Back in 2022, neighbors started asking me to keep an eye on their places while they were gone. I'd walk the house, send photos, and handle whatever came up. People kept asking, so I kept showing up.",
  "In 2025 that turned into Coastal Home Management 30A, and now it's a local team trained the way I started: show up, look closely, send the photos, and treat every home like it's on our own street.",
];

export function buildSubscriberWelcome({ firstName, storm, unsubToken }: Omit<SubscriberWelcomeInput, "email">) {
  const name = (firstName || "").trim();
  const hey = name ? `Hey ${esc(name)},` : "Hey there,";
  const subject = storm ? "You're on the 30A storm alerts list" : "You're on the list. Here's who I am";
  const what = storm
    ? "When a storm or a freeze is headed for 30A, you'll hear from me: what's coming, what to do with your home, and what I'm seeing on the ground. Now and then, a short note for 30A homeowners. That's it."
    : "Every so often you'll get a short note for 30A homeowners: what's happening around here, what to watch for at your place, and a heads up when a storm or a freeze is on the way. No spam.";
  const unsubUrl = `${SITE}/unsubscribe?t=${encodeURIComponent(unsubToken)}`;
  const postal = (process.env.MAIL_POSTAL_ADDRESS || "").trim();

  const html = `<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;max-width:540px;margin:0 auto;padding:34px 30px;background:#ffffff;border-top:3px solid #0d7f79;color:#0a0a0a;">
  <p style="margin:0 0 22px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#96969e;">Coastal Home Management 30A</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">${hey}</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Thanks for signing up. ${esc(what)}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:26px 0;border:1px solid #e6e4df;background:#f7f6f2;">
    <tr><td style="padding:0;">
      <img src="${SITE}/profile-web.jpg" alt="Ryder Schilling at a home in Watersound Origins" width="538" style="display:block;width:100%;height:auto;max-height:300px;object-fit:cover;border:0;" />
    </td></tr>
    <tr><td style="padding:22px 22px 24px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#0d7f79;">Who you'll hear from</p>
      <p style="margin:0 0 14px;font-size:20px;line-height:1.3;font-weight:600;">How this started</p>
      ${STORY.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#333;">${esc(p)}</p>`).join("")}
      <a href="${SITE}/about" style="font-size:14px;color:#0d7f79;text-decoration:none;">Read the full story &rarr;</a>
    </td></tr>
  </table>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Hit reply anytime. It comes straight to us.</p>
  <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Ryder Schilling<br /><span style="color:#56565c;">Coastal Home Management 30A</span><br /><a href="tel:${PHONE_TEL}" style="color:#0d7f79;text-decoration:none;">${PHONE_DISPLAY}</a></p>
  <p style="margin:30px 0 0;padding-top:16px;border-top:1px solid #eceae5;font-size:11.5px;line-height:1.6;color:#96969e;">You signed up at coastalhomemngt30a.com.${postal ? ` ${esc(postal)}.` : ""} <a href="${unsubUrl}" style="color:#96969e;">Unsubscribe</a></p>
</div>`;

  const text = [
    hey,
    "",
    `Thanks for signing up. ${what}`,
    "",
    "WHO YOU'LL HEAR FROM",
    ...STORY.flatMap((p) => [p, ""]),
    `Full story: ${SITE}/about`,
    "",
    "Hit reply anytime. It comes straight to us.",
    "",
    "Ryder Schilling",
    "Coastal Home Management 30A",
    PHONE_DISPLAY,
    "",
    `You signed up at coastalhomemngt30a.com.${postal ? ` ${postal}.` : ""}`,
    `Unsubscribe: ${unsubUrl}`,
  ].join("\n");

  return { subject, html, text, unsubUrl };
}

export async function sendSubscriberWelcome(input: SubscriberWelcomeInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!apiKey || !from || !input.email) return false;
  const { subject, html, text, unsubUrl } = buildSubscriberWelcome(input);
  try {
    const r = await new Resend(apiKey).emails.send({
      from,
      to: input.email,
      replyTo: process.env.REPLY_TO_EMAIL || "coastalhomemanagement30a@gmail.com",
      subject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${SITE}/api/unsubscribe?t=${encodeURIComponent(input.unsubToken)}>, <${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (r.error) {
      console.error("[subscriber-welcome] send failed:", r.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[subscriber-welcome] send failed:", err);
    return false;
  }
}
