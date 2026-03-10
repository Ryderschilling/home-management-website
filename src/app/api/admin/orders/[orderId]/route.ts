import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { getOrderById, updateOrderFulfillment, sendThankYouForOrder } from "@/lib/server/services/orders";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    const orderId = params.orderId;

    const body = await parseJsonBody(request);

    // Option A: fulfillment update
    if (body?.fulfillment_status) {
      const data = await updateOrderFulfillment(organizationId, orderId, String(body.fulfillment_status));
      if (!data) return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
      return NextResponse.json(ok(data));
    }

    // Option B: send thank-you email
    if (body?.action === "SEND_THANK_YOU") {
      const data = await sendThankYouForOrder(organizationId, orderId);
      if (!data) return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
      return NextResponse.json(ok(data));
    }

    return NextResponse.json(fail("BAD_REQUEST", "Nothing to update."), { status: 400 });
  } catch (error) {
    return NextResponse.json(
      fail("ORDER_UPDATE_FAILED", error instanceof Error ? error.message : "Failed to update order"),
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    const order = await getOrderById(organizationId, params.orderId);
    if (!order) return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
    return NextResponse.json(ok(order));
  } catch (error) {
    return NextResponse.json(
      fail("ORDER_GET_FAILED", error instanceof Error ? error.message : "Failed to load order"),
      { status: 400 }
    );
  }
}