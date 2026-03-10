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

    const fulfillmentStatus = String(
      body?.fulfillment_status ?? body?.status ?? ""
    ) as "NEW" | "ORDERED" | "INSTALLED" | "CANCELED";

    const sendThankYou =
      body?.sendThankYou === true || body?.action === "SEND_THANK_YOU";

    const existingOrder = await getOrderById(organizationId, orderId);

    if (!existingOrder) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), {
        status: 404,
      });
    }

    const updated = await updateOrderFulfillment(organizationId, orderId, {
      fulfillmentStatus: fulfillmentStatus || (existingOrder.fulfillment_status as
        | "NEW"
        | "ORDERED"
        | "INSTALLED"
        | "CANCELED"),
    });

    if (!updated) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), {
        status: 404,
      });
    }

    if (sendThankYou) {
      const email =
        typeof existingOrder.customer_email === "string" &&
        existingOrder.customer_email.trim()
          ? existingOrder.customer_email.trim()
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
          typeof existingOrder.customer_name === "string"
            ? existingOrder.customer_name
            : undefined,
      });

      const updatedWithThankYou = await updateOrderFulfillment(
        organizationId,
        orderId,
        {
          fulfillmentStatus:
            (updated.fulfillment_status as
              | "NEW"
              | "ORDERED"
              | "INSTALLED"
              | "CANCELED") ?? "NEW",
          thankYouSent: true,
        }
      );

      return NextResponse.json(ok(updatedWithThankYou));
    }

    return NextResponse.json(ok(updated));
  } catch (error) {
    return NextResponse.json(
      fail(
        "ORDER_FULFILLMENT_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update fulfillment"
      ),
      { status: 400 }
    );
  }
}