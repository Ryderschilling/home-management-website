import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { getOrderById, updateOrderFulfillment } from "@/lib/server/services/orders";
import { sendCustomerThankYouEmail } from "@/lib/server/email";

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

    if (body?.action === "SEND_THANK_YOU") {
      const order = await getOrderById(organizationId, orderId);

      if (!order) {
        return NextResponse.json(fail("NOT_FOUND", "Order not found."), {
          status: 404,
        });
      }

      const email =
        typeof order.customer_email === "string" && order.customer_email.trim()
          ? order.customer_email.trim()
          : null;

      if (!email) {
        return NextResponse.json(
          fail("BAD_REQUEST", "Order does not have a customer email."),
          { status: 400 }
        );
      }

      await sendCustomerThankYouEmail({
        to: email,
        name:
          typeof order.customer_name === "string" ? order.customer_name : undefined,
      });

      const updated = await updateOrderFulfillment(organizationId, orderId, {
        fulfillmentStatus:
          (order.fulfillment_status as
            | "NEW"
            | "ORDERED"
            | "INSTALLED"
            | "CANCELED") ?? "NEW",
        thankYouSent: true,
      });

      return NextResponse.json(ok(updated));
    }

    if (body?.fulfillment_status) {
      const fulfillmentStatus = String(body.fulfillment_status) as
        | "NEW"
        | "ORDERED"
        | "INSTALLED"
        | "CANCELED";

      const updated = await updateOrderFulfillment(organizationId, orderId, {
        fulfillmentStatus,
      });

      if (!updated) {
        return NextResponse.json(fail("NOT_FOUND", "Order not found."), {
          status: 404,
        });
      }

      return NextResponse.json(ok(updated));
    }

    return NextResponse.json(fail("BAD_REQUEST", "Nothing to update."), {
      status: 400,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        "ORDER_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update order"
      ),
      { status: 400 }
    );
  }
}

export async function GET(
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
    const order = await getOrderById(organizationId, orderId);

    if (!order) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), {
        status: 404,
      });
    }

    return NextResponse.json(ok(order));
  } catch (error) {
    return NextResponse.json(
      fail(
        "ORDER_GET_FAILED",
        error instanceof Error ? error.message : "Failed to load order"
      ),
      { status: 400 }
    );
  }
}