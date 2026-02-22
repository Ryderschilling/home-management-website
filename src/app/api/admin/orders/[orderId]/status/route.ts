import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { updateOrderStatus } from "@/lib/server/services/orders";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const { orderId } = await params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await updateOrderStatus(organizationId, orderId, body);
    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
    }
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(fail("ORDER_STATUS_UPDATE_FAILED", "Failed to update order status.", error instanceof Error ? error.message : error), { status: 400 });
  }
}
