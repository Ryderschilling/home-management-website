import { Resend } from "resend";
import type { Attribution } from "./attribution";
import type { ForwardResult } from "./forward-lead";

/**
 * Ryder's heads-up on every new lead (added 9/29/26 audit). Two jobs:
 *   1. Speed to lead: he hears about an opt-in the minute it happens.
 *   2. Backup: if the lead did NOT reach CHM Ops, this email is the record,
 *      and it says so in the subject line.
 */
const OWNER_FALLBACK = "coastalhomemanagement30a@gmail.com";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function dashboardBase(): string {
  const explicit = process.env.DASHBOARD_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  try {
    const u = new URL(process.env.DASHBOARD_INTAKE_URL || "");
    return u.origin;
  } catch {
    return "https://chm-dashboard.vercel.app";
  }
}

function sourceLine(a: Attribution | null): string {
  if (!a) return "No tracking cookie (typed in, or blocked)";
  const bits = [a.utmSource, a.utmMedium, a.utmCampaign, a.metaAdId ? `ad ${a.metaAdId}` : a.utmContent].filter(Boolean);
  if (bits.length) return bits.join(" / ");
  if (a.referrer) return `Came from ${a.referrer}`;
  return "Direct / typed in";
}

export async function sendLeadAlert(opts: {
  funnel: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  attribution: Attribution | null;
  result: ForwardResult;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!apiKey || !from) return;
  const to = process.env.LEAD_ALERT_EMAIL || process.env.BOOKING_NOTIFY_EMAIL || process.env.UPLOAD_NOTIFY_EMAIL || OWNER_FALLBACK;
  const { result } = opts;
  const who = opts.name || opts.email;
  const subject = !result.ok
    ? `LEAD NOT SAVED, add by hand: ${who}`
    : result.created
      ? `New lead: ${who} (${opts.funnel})`
      : `Came back: ${who} (${opts.funnel})`;
  const rows: Array<[string, string]> = [
    ["Email", opts.email],
    ["Name", opts.name || "Not given yet"],
    ["Mobile", opts.phone || "Not given yet"],
    ["Source", sourceLine(opts.attribution)],
    ["CHM Ops", result.ok ? (result.created ? "Saved as a new lead" : "Matched someone already there") : `NOT SAVED: ${result.error || "unknown error"}`],
  ];
  const link = result.clientId ? `${dashboardBase()}/clients/${result.clientId}` : `${dashboardBase()}/leads`;
  const table = `<table style="border-collapse:collapse;width:100%">${rows
    .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:12px;color:#96969e;width:90px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eceae5;font-size:15px">${esc(v)}</td></tr>`)
    .join("")}</table>`;
  try {
    await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: opts.email,
      subject,
      html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#0a0a0a">
  <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${result.ok ? "#96969e" : "#b3261e"};margin:0 0 8px">${esc(opts.funnel)}</p>
  <h1 style="font-size:20px;margin:0 0 18px">${result.ok ? "Reach out while it's fresh." : "This lead did not reach CHM Ops. Add it by hand."}</h1>${table}
  <p style="font-size:14px;margin:18px 0 0"><a href="${link}" style="color:#0d7f79">Open in CHM Ops</a>. Once you've talked or they replied, mark them Contacted so the follow-up emails stop.</p></div>`,
      text: `${subject}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${link}\nOnce you've talked or they replied, mark them Contacted so the follow-up emails stop.`,
    });
  } catch (err) {
    console.error("[lead-alert] failed:", err instanceof Error ? err.message : err);
  }
}
