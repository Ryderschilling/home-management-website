/**
 * /api/cron/gcal-sync
 *
 * Runs every 30 minutes via Vercel cron.
 * Pulls events from Google Calendar that were updated in the last hour,
 * matches them to CRM jobs by gcal_event_id, and updates scheduled_for
 * if Ryder moved the event on his Google Calendar.
 *
 * Only updates SCHEDULED or IN_PROGRESS jobs — never rewrites completed jobs.
 */

import { NextRequest, NextResponse } from "next/server";
import { sql, ensureAdminTables } from "@/lib/server/db";
import { getOrganizationId } from "@/lib/server/request";
import {
  listUpdatedCalendarEvents,
  isCalendarConnected,
} from "@/lib/server/services/google-calendar";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  // Allow Vercel cron (no auth header) or admin cookie access
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const authCookie = request.cookies.get("admin_authenticated")?.value;
  const isAdminCookie = authCookie === "true";

  if (!isVercelCron && !isAdminCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAdminTables();

  const organizationId = getOrganizationId(request);

  // Skip gracefully if Google Calendar is not connected yet
  const connected = await isCalendarConnected(organizationId);
  if (!connected) {
    return NextResponse.json({ skipped: true, reason: "Google Calendar not connected" });
  }

  // Fetch GCal events updated in the last hour (safe overlap for 30-min cron)
  const updatedMin = new Date(Date.now() - 60 * 60 * 1000);
  const events = await listUpdatedCalendarEvents(organizationId, updatedMin);

  if (events.length === 0) {
    return NextResponse.json({ synced: 0, skipped: 0 });
  }

  let synced = 0;
  let skipped = 0;

  for (const event of events) {
    if (!event.id) continue;

    // Find the matching CRM job by gcal_event_id
    const jobs = await sql<{ id: string; status: string; scheduled_for: string }[]>`
      SELECT id, status, scheduled_for
      FROM admin_jobs
      WHERE organization_id = ${organizationId}
        AND gcal_event_id = ${event.id}
      LIMIT 1
    `;

    const job = jobs[0];
    if (!job) {
      skipped++;
      continue;
    }

    // Never mutate completed or canceled jobs from a GCal change
    if (job.status === "COMPLETED" || job.status === "CANCELED") {
      skipped++;
      continue;
    }

    // If the GCal event was deleted/cancelled, skip — we don't auto-delete CRM jobs
    // from calendar changes to avoid accidental data loss
    if (event.status === "cancelled") {
      skipped++;
      continue;
    }

    // Extract the new start time from the GCal event
    const newStartRaw = event.start?.dateTime ?? event.start?.date;
    if (!newStartRaw) {
      skipped++;
      continue;
    }

    const newStart = new Date(newStartRaw);
    if (isNaN(newStart.getTime())) {
      skipped++;
      continue;
    }

    const currentStart = new Date(job.scheduled_for);

    // Only update if the date actually changed (within 1-minute tolerance)
    const diffMs = Math.abs(newStart.getTime() - currentStart.getTime());
    if (diffMs < 60_000) {
      skipped++;
      continue;
    }

    await sql`
      UPDATE admin_jobs
      SET
        scheduled_for  = ${newStart.toISOString()},
        gcal_synced_at = NOW(),
        updated_at     = NOW()
      WHERE organization_id = ${organizationId}
        AND id = ${job.id}
    `;

    synced++;
  }

  return NextResponse.json({
    synced,
    skipped,
    total: events.length,
    ranAt: new Date().toISOString(),
  });
}
