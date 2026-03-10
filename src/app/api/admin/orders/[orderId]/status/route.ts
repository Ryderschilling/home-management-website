import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { updateOrderFulfillment } from "@/lib/server/services/orders";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const { orderId } = await params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);

    const fulfillmentStatus = String(
      body?.fulfillment_status ?? body?.status ?? ""
    ) as "NEW" | "ORDERED" | "INSTALLED" | "CANCELED";

    if (!fulfillmentStatus) {
      return NextResponse.json(
        fail("BAD_REQUEST", "fulfillment_status is required."),
        { status: 400 }
      );
    }

    const data = await updateOrderFulfillment(organizationId, orderId, {
      fulfillmentStatus,
    });

    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), {
        status: 404,
      });
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "ORDER_STATUS_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update order status."
      ),
      { status: 400 }
    );
  }
}