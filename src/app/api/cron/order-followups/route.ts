import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/server/api";
import { getOrganizationId } from "@/lib/server/request";
import { sendEligibleInstalledOrderFollowUps } from "@/lib/server/services/orders";

export const runtime = "nodejs";

function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization")?.trim() === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Cron authorization required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const result = await sendEligibleInstalledOrderFollowUps(organizationId);
    return NextResponse.json(ok(result));
  } catch (error) {
    return NextResponse.json(
      fail(
        "ORDER_FOLLOW_UP_JOB_FAILED",
        error instanceof Error ? error.message : "Failed to send order follow-up emails"
      ),
      { status: 500 }
    );
  }
}
