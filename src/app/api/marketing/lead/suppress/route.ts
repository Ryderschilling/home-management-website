/**
 * POST /api/marketing/lead/suppress
 *
 * Cancels all pending drip emails for a lead and marks them suppressed.
 * Call this from the admin when a lead converts to a paying client.
 *
 * Body: { email: string }
 * Auth: Admin password header required.
 */

import { NextRequest, NextResponse } from "next/server";
import { ensureAdminTables } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { suppressLeadDrip } from "@/lib/server/lead-drip";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Simple admin auth — same pattern used elsewhere in the admin API
    const authHeader = req.headers.get("x-admin-password");
    if (authHeader !== env.ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    await ensureAdminTables();

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing email" } },
        { status: 400 }
      );
    }

    const result = await suppressLeadDrip(email);

    return NextResponse.json({
      ok: true,
      data: {
        email,
        cancelled: result.cancelled,
        errors: result.errors,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Suppress failed" } },
      { status: 500 }
    );
  }
}
