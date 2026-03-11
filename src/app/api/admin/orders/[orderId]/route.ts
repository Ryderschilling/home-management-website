// src/app/api/admin/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import {
  deleteOrder,
  getOrderById,
  sendThankYouEmailAndMarkSent,
  updateOrder,
} from "@/lib/server/services/orders";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  const { orderId } = await params;

  try {
    const organizationId = getOrganizationId(request);
    const order = await getOrderById(organizationId, orderId);
    if (!order) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
    }
    return NextResponse.json(ok(order));
  } catch (error) {
    return NextResponse.json(
      fail("ORDER_GET_FAILED", error instanceof Error ? error.message : "Failed to get order"),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  const { orderId } = await params;

  try {
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const updated = await updateOrder(organizationId, orderId, body);
    if (!updated) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
    }
    return NextResponse.json(ok(updated));
  } catch (error) {
    return NextResponse.json(
      fail("ORDER_UPDATE_FAILED", error instanceof Error ? error.message : "Failed to update order"),
      { status: 400 }
    );
  }
}

// Send thank-you (called after INSTALLED)
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  const { orderId } = await params;

  try {
    const organizationId = getOrganizationId(request);
    const result = await sendThankYouEmailAndMarkSent(organizationId, orderId);
    if (!result) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
    }
    return NextResponse.json(ok(result));
  } catch (error) {
    return NextResponse.json(
      fail("THANK_YOU_FAILED", error instanceof Error ? error.message : "Failed to send thank-you"),
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  const { orderId } = await params;

  try {
    const organizationId = getOrganizationId(request);
    const okDelete = await deleteOrder(organizationId, orderId);
    if (!okDelete) {
      return NextResponse.json(fail("NOT_FOUND", "Order not found."), { status: 404 });
    }
    return NextResponse.json(ok({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      fail("ORDER_DELETE_FAILED", error instanceof Error ? error.message : "Failed to delete order"),
      { status: 400 }
    );
  }
}