import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { createProperty, listProperties } from "@/lib/server/services/properties";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const data = await listProperties(organizationId);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "PROPERTIES_LIST_FAILED",
        error instanceof Error ? error.message : "Failed to list properties"
      ),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await createProperty(organizationId, body);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "PROPERTY_CREATE_FAILED",
        error instanceof Error ? error.message : "Failed to create property"
      ),
      { status: 400 }
    );
  }
}