/**
 * Google Calendar integration for CHM portal.
 *
 * Flow:
 *  1. Ryder visits /api/google/auth once → authorizes → refresh token stored in google_tokens table.
 *  2. Every job create/update/delete pushes to Google Calendar (using the stored refresh token).
 *  3. A cron (/api/cron/gcal-sync) runs every 30 min to pull GCal changes back into the CRM.
 *
 * Token is refreshed on every request — short-lived access tokens, long-lived refresh token.
 */

import { sql } from "@/lib/server/db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// ── Table bootstrap ───────────────────────────────────────────────────────────

export async function ensureGoogleTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS google_tokens (
      organization_id TEXT NOT NULL PRIMARY KEY,
      refresh_token   TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// ── Token storage ─────────────────────────────────────────────────────────────

export async function saveRefreshToken(
  organizationId: string,
  refreshToken: string
): Promise<void> {
  await ensureGoogleTables();
  await sql`
    INSERT INTO google_tokens (organization_id, refresh_token)
    VALUES (${organizationId}, ${refreshToken})
    ON CONFLICT (organization_id)
    DO UPDATE SET refresh_token = EXCLUDED.refresh_token, updated_at = NOW()
  `;
}

async function getRefreshToken(organizationId: string): Promise<string | null> {
  await ensureGoogleTables();
  const rows = await sql<{ refresh_token: string }[]>`
    SELECT refresh_token FROM google_tokens WHERE organization_id = ${organizationId}
  `;
  return rows[0]?.refresh_token ?? null;
}

export async function isCalendarConnected(organizationId: string): Promise<boolean> {
  const token = await getRefreshToken(organizationId);
  return token !== null;
}

// ── Access token (fresh on every call — no caching needed at this scale) ─────

async function getAccessToken(organizationId: string): Promise<string> {
  const refreshToken = await getRefreshToken(organizationId);

  if (!refreshToken) {
    throw new Error(
      "Google Calendar is not connected. Visit /api/google/auth in your portal to connect it."
    );
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };

  if (!data.access_token) {
    throw new Error(`Failed to refresh Google access token: ${data.error ?? "unknown error"}`);
  }

  return data.access_token;
}

// ── Event helpers ─────────────────────────────────────────────────────────────

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_DEFAULT_ID ?? "primary";
const TIMEZONE = "America/Chicago"; // 30A / CST

type CalendarEventInput = {
  organizationId: string;
  title: string;
  description?: string | null;
  scheduledFor: Date;
  durationMinutes?: number | null;
};

function buildEventBody(input: CalendarEventInput) {
  const start = new Date(input.scheduledFor);
  const durationMs = (input.durationMinutes ?? 60) * 60_000;
  const end = new Date(start.getTime() + durationMs);

  return {
    summary: input.title,
    description: input.description ?? "",
    start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
    // Tag so we can identify CHM-managed events in the pull sync
    extendedProperties: {
      private: { source: "chm-portal" },
    },
  };
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Creates a Google Calendar event. Returns the GCal event ID or null on failure.
 * Failures are logged and swallowed — GCal sync is best-effort; it should never
 * block a job from saving.
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<string | null> {
  try {
    const token = await getAccessToken(input.organizationId);
    const body = buildEventBody(input);

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = (await res.json()) as { id?: string; error?: unknown };

    if (!res.ok) {
      console.error("[gcal] createCalendarEvent error:", data.error);
      return null;
    }

    return data.id ?? null;
  } catch (err) {
    console.error("[gcal] createCalendarEvent failed:", err);
    return null;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCalendarEvent(
  gcalEventId: string,
  input: CalendarEventInput
): Promise<void> {
  try {
    const token = await getAccessToken(input.organizationId);
    const body = buildEventBody(input);

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${gcalEventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const data = (await res.json()) as { error?: unknown };
      console.error("[gcal] updateCalendarEvent error:", data.error);
    }
  } catch (err) {
    console.error("[gcal] updateCalendarEvent failed:", err);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCalendarEvent(
  gcalEventId: string,
  organizationId: string
): Promise<void> {
  try {
    const token = await getAccessToken(organizationId);

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${gcalEventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 404 = already deleted, 410 = gone — both are fine
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      console.error("[gcal] deleteCalendarEvent HTTP", res.status);
    }
  } catch (err) {
    console.error("[gcal] deleteCalendarEvent failed:", err);
  }
}

// ── Pull sync (GCal → CRM) ────────────────────────────────────────────────────

export type GCalEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string; // "confirmed" | "tentative" | "cancelled"
  updated?: string;
};

/**
 * Returns all events in the CHM calendar that were updated after `updatedMin`.
 * Used by the gcal-sync cron to detect date changes made in the Google Calendar app.
 */
export async function listUpdatedCalendarEvents(
  organizationId: string,
  updatedMin: Date
): Promise<GCalEvent[]> {
  try {
    const token = await getAccessToken(organizationId);

    const params = new URLSearchParams({
      updatedMin: updatedMin.toISOString(),
      singleEvents: "true",
      maxResults: "250",
      orderBy: "updated",
      showDeleted: "true", // include cancelled events so we can mark jobs canceled
    });

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      console.error("[gcal] listUpdatedCalendarEvents HTTP", res.status);
      return [];
    }

    const data = (await res.json()) as { items?: GCalEvent[] };
    return data.items ?? [];
  } catch (err) {
    console.error("[gcal] listUpdatedCalendarEvents failed:", err);
    return [];
  }
}
