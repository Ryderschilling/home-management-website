import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { getOrderById, updateOrderFulfillment } from "@/lib/server/services/orders";
import { sendCustomerThankYouEmail } from "@/lib/server/email";

export const runtime = "nodejs";

const ALLOWED = new Set(["NEW", "ORDERED", "INSTALLED", "CANCELED"]);

function pickStatus(body: any): string {
  const raw =
    body?.fulfillmentStatus ??
    body?.fulfillment_status ??
    body?.status ??
    "";
  return String(raw || "").trim().toUpperCase();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const { orderId } = params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);

    const status = pickStatus(body);
    if (!ALLOWED.has(status)) {
      return NextResponse.json(
        fail("INVALID_STATUS", "Invalid fulfillment status."),
        { status: 400 }
      );
    }

    // Update first
    const updated = await updateOrderFulfillment(organizationId, orderId, {
      fulfillmentStatus: status,
    });

    if (!updated) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
    }

    // If newly INSTALLED, send thank-you email once
    if (status === "INSTALLED") {
      const full = await getOrderById(organizationId, orderId);

      // Only send if we have a customer email and haven’t sent already
      if (full?.customer_email && !full?.thank_you_sent_at) {
        await sendCustomerThankYouEmail({
          to: full.customer_email,
          name: full.customer_name ?? undefined,
        });

        // mark sent timestamp (re-using fulfillment updater so we don’t introduce a new API)
        await updateOrderFulfillment(organizationId, orderId, {
          thankYouSent: true,
        });
      }
    }

    return NextResponse.json(ok(updated));
  } catch (error) {
    return NextResponse.json(
      fail(
        "ORDER_FULFILLMENT_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update fulfillment."
      ),
      { status: 500 }
    );
  }
}