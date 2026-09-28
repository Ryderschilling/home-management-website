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

export async function forwardLeadToDashboard(p: LeadPayload): Promise<void> {
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
  if (!url || !secret) return; // not configured yet, skip silently
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-secret": secret },
      body: JSON.stringify({ ...p, eventLabel: undefined, attribution }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // swallow: the lead email already went out, dashboard sync is a bonus
  }
}
