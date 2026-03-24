import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { getAnalytics } from "@/lib/server/services/analytics";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const { searchParams } = new URL(request.url);
    const data = await getAnalytics(organizationId, searchParams.get("range"));
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "ANALYTICS_LOAD_FAILED",
        error instanceof Error ? error.message : "Failed to load analytics"
      ),
      { status: 500 }
    );
  }
}
