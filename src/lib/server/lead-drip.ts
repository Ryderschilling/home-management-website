/**
 * CHM Lead Drip Email Sequence
 *
 * Fires 5 scheduled follow-up emails after a new lead opts in.
 * Uses Resend's `scheduledAt` to queue each email at the right delay.
 * Errors are caught and logged — a failed schedule never blocks lead capture.
 *
 * Sequence:
 *   Email 2 — Day 1  : "5 things that go wrong while you're away" (education/value)
 *   Email 3 — Day 3  : "The furnace was out. The freeze was two days away." (real story / social proof)
 *   Email 4 — Day 5  : "Here's exactly what a plan looks like" (soft close)
 *   Email 5 — Day 7  : "Your backflow pipes may be exposed" (rock install + photo + QR order link)
 */

import { Resend } from "resend";
import { env } from "@/lib/server/env";
import { sql } from "@/lib/server/db";

const resend = new Resend(env.RESEND_API_KEY);

const REPLY_TO = "coastalhomemanagement30a@gmail.com";

// ─── Shared styles ────────────────────────────────────────────────────────────

const baseWrap = `
  background:#f5f5f3;
  font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  padding:40px 20px;
`;

const card = `
  max-width:520px;
  background:#fafaf8;
  border-top:3px solid #0b0b0b;
`;

const eyebrow = `
  margin:0 0 28px 0;
  font-size:10px;
  letter-spacing:0.22em;
  text-transform:uppercase;
  color:rgba(0,0,0,0.4);
`;

const h1 = `
  margin:0 0 16px 0;
  font-family:ui-serif,Georgia,'Times New Roman',Times,serif;
  font-size:26px;
  font-weight:600;
  line-height:1.1;
  letter-spacing:-0.02em;
  color:#0b0b0b;
`;

const divider = `
  width:40px;height:1px;background:rgba(0,0,0,0.15);margin:20px 0;
`;

const bodyText = `
  margin:0 0 20px 0;
  font-size:15px;
  line-height:1.65;
  color:rgba(0,0,0,0.7);
`;

const ctaBtn = `
  display:inline-block;
  background:#0b0b0b;
  color:#fafaf8;
  text-decoration:none;
  font-size:11px;
  letter-spacing:0.2em;
  text-transform:uppercase;
  padding:14px 28px;
  font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;
`;

const sig = `
  margin:0;
  font-size:14px;
  line-height:1.6;
  color:rgba(0,0,0,0.6);
`;

const footer = `
  padding:16px 44px 24px;
  background:#f0efed;
`;

const footerText = `
  margin:0;
  font-size:11px;
  color:rgba(0,0,0,0.35);
  line-height:1.5;
`;

function wrap(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;${baseWrap}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="${card}">
          ${inner}
          <tr>
            <td style="padding:24px 44px 36px;border-top:1px solid rgba(0,0,0,0.08);">
              <p style="${sig}">
                — Ryder<br/>
                <span style="font-size:12px;color:rgba(0,0,0,0.4);">Coastal Home Management 30A</span><br/>
                <a href="tel:3094158793" style="font-size:12px;color:rgba(0,0,0,0.4);text-decoration:none;">(309) 415-8793</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="${footer}">
              <p style="${footerText}">
                You're receiving this because you requested information at coastalhomemanagement30a.com.<br/>
                This is a real person, not a marketing bot.
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

// ─── Email 2 — Day 1: Education/value ─────────────────────────────────────────

function email2(name: string): string {
  const items = [
    ["Storm damage", "A loose shutter, water intrusion through a cracked seal, or a downed fence that sits for two weeks before anyone notices."],
    ["HVAC failure", "System goes out, humidity spikes, and mold starts forming inside your walls before you get the call."],
    ["Package theft", "Deliveries stack up on the porch. It's an obvious tell that no one's home."],
    ["Contractor no-shows", "You schedule a repair. They show up. No one's there to let them in. They leave. You reschedule. It drags on for months."],
    ["Slow leaks", "A dripping supply line under a sink, a hairline crack in a pipe fitting. Small problems that become $10,000 problems."],
  ];

  const listRows = items.map(([title, desc]) => `
    <tr>
      <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid rgba(0,0,0,0.06);">
        <p style="margin:0 0 3px 0;font-size:14px;font-weight:600;color:#0b0b0b;">${title}</p>
        <p style="margin:0;font-size:13px;line-height:1.55;color:rgba(0,0,0,0.6);">${desc}</p>
      </td>
    </tr>`).join("");

  return wrap(`
    <tr>
      <td style="padding:36px 44px 0;">
        <p style="${eyebrow}">Coastal Home Management 30A</p>
        <h1 style="${h1}">5 things that go wrong in 30A homes while owners are away.</h1>
        <div style="${divider}"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 32px;">
        <p style="${bodyText}">Hey ${name} — I've been doing this for years in Watersound Origins and Naturewalk, and the same problems come up over and over.</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px 0;">
          ${listRows}
        </table>
        <p style="${bodyText}">Every one of these is preventable with consistent eyes on the property. That's the whole job.</p>
        <p style="${bodyText}">I still owe you a walkthrough. When's a good time to connect?</p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <a href="mailto:coastalhomemanagement30a@gmail.com?subject=Walkthrough%20Request" style="${ctaBtn}">
                Reply to schedule
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ─── Email 3 — Day 3: Social proof ────────────────────────────────────────────

function email3(name: string): string {
  return wrap(`
    <tr>
      <td style="padding:36px 44px 0;">
        <p style="${eyebrow}">Coastal Home Management 30A</p>
        <h1 style="${h1}">The furnace was out. The freeze was two days away.</h1>
        <div style="${divider}"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 32px;">
        <p style="${bodyText}">Hey ${name},</p>
        <p style="${bodyText}">One of my clients — Scott and his family, out of Illinois — were away from their Watersound property when I came in for a routine check a couple days before a hard freeze was forecast for the area.</p>
        <p style="${bodyText}">The heating system wasn't running. Something had failed while they were gone, and with temperatures about to drop hard, an unheated home in those conditions means burst pipes, water damage, potentially tens of thousands of dollars in repairs.</p>
        <p style="${bodyText}">I caught it, called a technician that same day, and we had it back up and running before the cold hit. The house came through the freeze without a single issue.</p>
        <p style="${bodyText}">That's exactly the point of having someone local keeping eyes on your property.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;background:#f5f5f3;border-left:3px solid #0b0b0b;width:100%;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0 0 8px 0;font-size:15px;font-style:italic;line-height:1.6;color:rgba(0,0,0,0.75);">"Ryder has helped us with our home for years and has always been reliable, professional, and great to work with. He consistently does an excellent job and is someone we truly trust."</p>
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(0,0,0,0.4);">Scott Clark — Homeowner, Watersound Origins</p>
            </td>
          </tr>
        </table>
        <p style="${bodyText}">Still happy to walk your property whenever works for you. Just reply here.</p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <a href="mailto:coastalhomemanagement30a@gmail.com?subject=Walkthrough" style="${ctaBtn}">
                Let's connect
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ─── Email 4 — Day 5: Soft close / services breakdown ─────────────────────────

function email4(name: string): string {
  const tiers = [
    ["Basic Watch", "$100–$150/mo", "Weekly exterior check-ins, photo report, storm and freeze prep alerts."],
    ["Full Management", "$200–$300/mo", "Full interior + exterior inspections, contractor coordination, package handling, seasonal prep, on-call response."],
    ["On-Call Only", "$75 base + $45/hr", "No retainer. Call when you need something handled. Perfect if you're here more often."],
  ];

  const rows = tiers.map(([tier, price, desc]) => `
    <tr>
      <td style="padding:12px 0;vertical-align:top;border-bottom:1px solid rgba(0,0,0,0.06);">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding-bottom:3px;">
              <span style="font-size:14px;font-weight:600;color:#0b0b0b;">${tier}</span>
              <span style="font-size:12px;color:rgba(0,0,0,0.4);margin-left:10px;">${price}</span>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0;font-size:13px;line-height:1.55;color:rgba(0,0,0,0.6);">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  return wrap(`
    <tr>
      <td style="padding:36px 44px 0;">
        <p style="${eyebrow}">Coastal Home Management 30A</p>
        <h1 style="${h1}">Here's exactly what a plan with me looks like.</h1>
        <div style="${divider}"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 32px;">
        <p style="${bodyText}">Hey ${name} — in case it helps to see specifics before we talk:</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px 0;">
          ${rows}
        </table>
        <p style="${bodyText}">No long-term contracts. No corporate structure. Just me, your property, and a clear record of every visit.</p>
        <p style="${bodyText}">Most clients start with a walkthrough, we figure out what level of coverage makes sense, and go from there. Takes 20 minutes.</p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <a href="mailto:coastalhomemanagement30a@gmail.com?subject=Ready%20to%20Talk" style="${ctaBtn}">
                Set up a walkthrough
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ─── Email 5 — Day 7: Rock installation ──────────────────────────────────────

function email5(name: string, appUrl: string): string {
  const qrUrl = `${appUrl}/qr`;
  const photoUrl = `${appUrl}/rocks/electrical-box-cover-after.jpg`;

  return wrap(`
    <tr>
      <td style="padding:36px 44px 0;">
        <p style="${eyebrow}">Coastal Home Management 30A</p>
        <h1 style="${h1}">Your backflow pipes may be exposed. Here's a quick fix most Watersound owners don't know about.</h1>
        <div style="${divider}"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 32px;">
        <p style="${bodyText}">Hey ${name},</p>
        <p style="${bodyText}">If your home is in Watersound Origins or Naturewalk, there's a good chance you have exposed backflow prevention pipes in your yard — grey pipe sticking up out of the ground, sometimes with a green or black box around it. Many properties in these neighborhoods have them.</p>
        <p style="${bodyText}">Most homeowners leave them as-is. I install custom-measured decorative rock covers that fit directly over the pipe assembly. They look intentional, they match the landscaping, and they take maybe 30 minutes to install.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;width:100%;">
          <tr>
            <td>
              <img src="${photoUrl}" alt="Artificial rock cover installed over backflow pipe" width="100%" style="display:block;width:100%;max-width:432px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0 0 0;">
              <p style="margin:0;font-size:11px;color:rgba(0,0,0,0.35);letter-spacing:0.08em;">Installed at a Watersound Origins property</p>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;width:100%;">
          <tr>
            <td style="padding:16px 20px;background:#f5f5f3;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:rgba(0,0,0,0.65);">✓ &nbsp; Custom-measured to your pipe setup</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:rgba(0,0,0,0.65);">✓ &nbsp; Professional installation included</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:rgba(0,0,0,0.65);">✓ &nbsp; $350 per rock, fully installed</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:rgba(0,0,0,0.65);">✓ &nbsp; Neighbors ask about them — they've turned into leads</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="${bodyText}">You can see more photos and place an order directly online — takes two minutes.</p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <a href="${qrUrl}" style="${ctaBtn}">
                See photos &amp; order
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0 0;font-size:13px;line-height:1.65;color:rgba(0,0,0,0.5);">
          Or just reply here if you want to ask a question first. Happy to walk you through it.
        </p>
      </td>
    </tr>
  `);
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Schedule the full drip sequence for a new lead.
 * Captures Resend email IDs and stores them on the lead record so the
 * sequence can be cancelled later if the lead converts to a client.
 */
export async function scheduleDripSequence(
  firstName: string | null,
  email: string,
  appUrl: string,
  fromEmail: string,
  replyTo: string = REPLY_TO,
  orgId: string = env.DEFAULT_ORGANIZATION_ID
) {
  const name = firstName || "there";
  const now = Date.now();

  const sequence: Array<{ subject: string; html: string; delayMs: number }> = [
    {
      subject: "5 things that go wrong in 30A homes while owners are away",
      html: email2(name),
      delayMs: 24 * 60 * 60 * 1000, // Day 1
    },
    {
      subject: "The furnace was out. The freeze was two days away.",
      html: email3(name),
      delayMs: 3 * 24 * 60 * 60 * 1000, // Day 3
    },
    {
      subject: "Here's exactly what a plan with me looks like",
      html: email4(name),
      delayMs: 5 * 24 * 60 * 60 * 1000, // Day 5
    },
    {
      subject: "Your backflow pipes may be exposed — quick fix for Watersound homeowners",
      html: email5(name, appUrl),
      delayMs: 7 * 24 * 60 * 60 * 1000, // Day 7
    },
  ];

  const scheduledIds: string[] = [];

  for (const item of sequence) {
    const scheduledAt = new Date(now + item.delayMs).toISOString();
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        replyTo,
        subject: item.subject,
        html: item.html,
        scheduledAt,
      });
      // Resend returns { data: { id } } on success
      const id = (result as { data?: { id?: string } })?.data?.id;
      if (id) scheduledIds.push(id);
    } catch (err) {
      console.error(`[CHM] Drip email failed to schedule (subject: "${item.subject}"):`, err);
    }
  }

  // Persist IDs to the lead record so we can cancel on conversion
  if (scheduledIds.length > 0) {
    try {
      await sql`
        UPDATE marketing_email_leads
        SET drip_email_ids = ${JSON.stringify(scheduledIds)}, updated_at = NOW()
        WHERE organization_id = ${orgId}
          AND lower(email) = ${email.toLowerCase()}
      `;
    } catch (err) {
      console.error("[CHM] Failed to store drip email IDs:", err);
    }
  }
}

/**
 * Cancel all pending drip emails for a lead and mark them suppressed.
 * Call this when a lead converts to a paying client.
 */
export async function suppressLeadDrip(
  email: string,
  orgId: string = env.DEFAULT_ORGANIZATION_ID
): Promise<{ cancelled: number; errors: number }> {
  let cancelled = 0;
  let errors = 0;

  try {
    const rows = await sql<{ drip_email_ids: string | null }[]>`
      SELECT drip_email_ids
      FROM marketing_email_leads
      WHERE organization_id = ${orgId}
        AND lower(email) = ${email.toLowerCase()}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row || !row.drip_email_ids) {
      return { cancelled: 0, errors: 0 };
    }

    const ids: string[] = JSON.parse(row.drip_email_ids);

    for (const id of ids) {
      try {
        await resend.emails.cancel(id);
        cancelled++;
      } catch (err) {
        // Email may have already sent — that's fine
        console.warn(`[CHM] Could not cancel drip email ${id}:`, err);
        errors++;
      }
    }

    // Mark lead as suppressed regardless of cancel results
    await sql`
      UPDATE marketing_email_leads
      SET status = 'suppressed', drip_suppressed_at = NOW(), updated_at = NOW()
      WHERE organization_id = ${orgId}
        AND lower(email) = ${email.toLowerCase()}
    `;
  } catch (err) {
    console.error("[CHM] suppressLeadDrip failed:", err);
    errors++;
  }

  return { cancelled, errors };
}
