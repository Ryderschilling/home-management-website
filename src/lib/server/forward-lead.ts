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
};

export async function forwardLeadToDashboard(p: LeadPayload): Promise<void> {
  const url = process.env.DASHBOARD_INTAKE_URL;
  const secret = process.env.INTAKE_SECRET;
  if (!url || !secret) return; // not configured yet, skip silently
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-secret": secret },
      body: JSON.stringify(p),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // swallow: the lead email already went out, dashboard sync is a bonus
  }
}
