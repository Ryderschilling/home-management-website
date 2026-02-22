import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { deleteProperty, updateProperty } from "@/lib/server/services/properties";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const { propertyId } = await params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await updateProperty(organizationId, propertyId, body);
    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Property not found."), { status: 404 });
    }
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(fail("PROPERTY_UPDATE_FAILED", "Failed to update property.", error instanceof Error ? error.message : error), { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const { propertyId } = await params;
    const organizationId = getOrganizationId(request);
    const deleted = await deleteProperty(organizationId, propertyId);
    if (!deleted) {
      return NextResponse.json(fail("NOT_FOUND", "Property not found."), { status: 404 });
    }
    return NextResponse.json(ok({ deleted: true }));
  } catch (error) {
    return NextResponse.json(fail("PROPERTY_DELETE_FAILED", "Failed to delete property.", error instanceof Error ? error.message : error), { status: 400 });
  }
}
