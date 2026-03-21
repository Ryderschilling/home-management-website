import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { createInvoice, listInvoices } from "@/lib/server/services/invoices";

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
    const data = await listInvoices(organizationId, {
      clientId: searchParams.get("clientId"),
      status: searchParams.get("status"),
    });
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "INVOICES_LIST_FAILED",
        error instanceof Error ? error.message : "Failed to list invoices"
      ),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await createInvoice(organizationId, body);
    return NextResponse.json(ok(data), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      fail(
        "INVOICE_CREATE_FAILED",
        error instanceof Error ? error.message : "Failed to create invoice"
      ),
      { status: 400 }
    );
  }
}
