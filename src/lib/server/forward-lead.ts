import { readAttribution } from "./attribution";
import { prisma } from "@/lib/prisma";

/**
 * Forward a website lead into the CHM dashboard as a LEAD client, so the
 * dashboard is the single source of truth. Best effort: never blocks or
 * breaks the form, the confirmation email is the primary path.
 */
type LeadPayload = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  source?: string | null;
  community?: string | null;
  /** They picked a walkthrough day, so they land as BOOKED, not NEW. */
  booked?: boolean;
  /** Which step of a funnel this was ("optin", "walkthrough", "start"), for /ads. */
  eventLabel?: string;
  /** "buy": they asked to start now, not just to talk. */
  intent?: "buy";
};

export type ForwardResult = {
  ok: boolean;
  /** CHM Ops made a brand-new person (false = matched someone already there). */
  created?: boolean;
  clientId?: string;
  /** CHM Ops sent the welcome email from Gmail (lead inbox). Do not send the site's copy. */
  welcomeSent?: boolean;
  error?: string;
};

/**
 * Two tries (9/29/26 audit): a Neon cold start or a slow deploy used to lose
 * the lead silently. Now the caller learns whether it landed, so it can warn
 * Ryder by email with the lead's details when it did not.
 */
export async function forwardLeadToDashboard(p: LeadPayload): Promise<ForwardResult> {
  const url = process.env.DASHBOARD_INTAKE_URL;
  const secret = process.env.INTAKE_SECRET;
  // Which ad / search / post brought this person, from the tracker cookie.
  const { attribution, path } = await readAttribution();
  // Record the conversion as an event too, so the page funnel on /ads counts it.
  if (attribution?.visitorId && path) {
    await prisma.trackEvent
      .create({ data: { visitorId: attribution.visitorId, type: "lead", path, label: p.eventLabel ?? null, utmSource: attribution.utmSource ?? null, utmCampaign: attribution.utmCampaign ?? null, utmContent: attribution.utmContent ?? null, metaAdId: attribution.metaAdId && /^\d+$/.test(attribution.metaAdId) ? attribution.metaAdId : null } })
      .catch(() => {});
  }
  if (!url || !secret) {
    console.error("[forward-lead] DASHBOARD_INTAKE_URL or INTAKE_SECRET missing");
    return { ok: false, error: "DASHBOARD_INTAKE_URL or INTAKE_SECRET is not set on Vercel" };
  }
  // `step` tells CHM Ops which funnel step this was, so its lead inbox can
  // send the welcome from Gmail (optin) or draft a reply (info).
  const body = JSON.stringify({ ...p, eventLabel: undefined, step: p.eventLabel ?? null, attribution });
  let lastError = "";
  for (const [i, ms] of [7000, 9000].entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-intake-secret": secret },
        body,
        signal: AbortSignal.timeout(ms),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; created?: boolean; clientId?: string; welcomeSent?: boolean; error?: string };
      if (res.ok && data.ok !== false) return { ok: true, created: data.created === true, clientId: data.clientId, welcomeSent: data.welcomeSent === true };
      lastError = `CHM Ops answered ${res.status}${data.error ? `: ${data.error}` : ""}`;
      // A 4xx will not fix itself on a retry.
      if (res.status >= 400 && res.status < 500) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  console.error("[forward-lead] lead did not reach CHM Ops:", lastError);
  return { ok: false, error: lastError };
}
