import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/server/api";
import { getOrganizationId } from "@/lib/server/request";
import { sendScheduledInvoices } from "@/lib/server/services/invoices";

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
    const result = await sendScheduledInvoices(organizationId);
    return NextResponse.json(ok(result));
  } catch (error) {
    return NextResponse.json(
      fail(
        "SCHEDULED_INVOICE_SEND_FAILED",
        error instanceof Error ? error.message : "Failed to send scheduled invoices"
      ),
      { status: 500 }
    );
  }
}
