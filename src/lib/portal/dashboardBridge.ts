/**
 * Server-to-server calls into the CHM Ops dashboard. Same secret as the lead
 * bridge (INTAKE_SECRET). Best effort: the dashboard's own cron re-pushes any
 * job the call missed, so a failure here never blocks an order.
 *
 * DASHBOARD_URL is derived from DASHBOARD_INTAKE_URL when not set explicitly.
 */
function dashboardBase(): string | null {
  const explicit = process.env.DASHBOARD_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const intake = process.env.DASHBOARD_INTAKE_URL;
  if (!intake) return null;
  try {
    return new URL(intake).origin;
  } catch {
    return null;
  }
}

/** Ask the dashboard to mirror these jobs onto Google Calendar right now. */
export async function pushJobsToCalendar(jobIds: string[]): Promise<void> {
  const base = dashboardBase();
  const secret = process.env.INTAKE_SECRET;
  if (!base || !secret || jobIds.length === 0) return;
  try {
    await fetch(`${base}/api/intake/push-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-secret": secret },
      body: JSON.stringify({ jobIds }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.warn("[portal] push-jobs call failed, the dashboard cron will catch it", e);
  }
}
