import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import {
  deleteProperty,
  getPropertyById,
  updateProperty,
} from "@/lib/server/services/properties";

export const runtime = "nodejs";

type Params = { params: Promise<{ propertyId: string }> };

export async function GET(request: NextRequest, context: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const { propertyId } = await context.params;
    const data = await getPropertyById(organizationId, propertyId);
    if (!data) {
      return NextResponse.json(
        fail("PROPERTY_NOT_FOUND", "Property not found"),
        { status: 404 }
      );
    }
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "PROPERTY_GET_FAILED",
        error instanceof Error ? error.message : "Failed to load property"
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
    const { propertyId } = await context.params;
    const body = await parseJsonBody(request);
    const data = await updateProperty(organizationId, propertyId, body);

    if (!data) {
      return NextResponse.json(
        fail("PROPERTY_NOT_FOUND", "Property not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "PROPERTY_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update property"
      ),
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, context: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const { propertyId } = await context.params;
    const deleted = await deleteProperty(organizationId, propertyId);

    if (!deleted) {
      return NextResponse.json(
        fail("PROPERTY_NOT_FOUND", "Property not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(ok({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      fail(
        "PROPERTY_DELETE_FAILED",
        error instanceof Error ? error.message : "Failed to delete property"
      ),
      { status: 400 }
    );
  }
}