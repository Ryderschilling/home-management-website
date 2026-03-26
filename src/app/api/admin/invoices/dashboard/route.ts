import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { getInvoiceDashboardData } from "@/lib/server/services/invoices";

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
    const data = await getInvoiceDashboardData(organizationId);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "INVOICE_DASHBOARD_FAILED",
        error instanceof Error ? error.message : "Failed to load invoice dashboard"
      ),
      { status: 500 }
    );
  }
}
