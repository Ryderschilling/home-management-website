import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { getInvoiceById, updateInvoice } from "@/lib/server/services/invoices";

export const runtime = "nodejs";

type Params = { params: Promise<{ invoiceId: string }> };

export async function GET(request: NextRequest, context: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const { invoiceId } = await context.params;
    const data = await getInvoiceById(organizationId, invoiceId);

    if (!data) {
      return NextResponse.json(fail("INVOICE_NOT_FOUND", "Invoice not found"), {
        status: 404,
      });
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "INVOICE_GET_FAILED",
        error instanceof Error ? error.message : "Failed to load invoice"
      ),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const { invoiceId } = await context.params;
    const body = await parseJsonBody(request);
    const data = await updateInvoice(organizationId, invoiceId, body);

    if (!data) {
      return NextResponse.json(fail("INVOICE_NOT_FOUND", "Invoice not found"), {
        status: 404,
      });
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "INVOICE_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update invoice"
      ),
      { status: 400 }
    );
  }
}
