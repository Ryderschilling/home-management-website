import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { createService, listServices } from "@/lib/server/services/services";

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
    const data = await listServices(organizationId);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "SERVICES_LIST_FAILED",
        error instanceof Error ? error.message : "Failed to list services"
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
    const data = await createService(organizationId, body);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "SERVICE_CREATE_FAILED",
        error instanceof Error ? error.message : "Failed to create service"
      ),
      { status: 400 }
    );
  }
}