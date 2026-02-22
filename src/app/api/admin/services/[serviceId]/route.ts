import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { deleteService, updateService } from "@/lib/server/services/services";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const { serviceId } = await params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await updateService(organizationId, serviceId, body);
    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Service not found."), { status: 404 });
    }
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(fail("SERVICE_UPDATE_FAILED", "Failed to update service.", error instanceof Error ? error.message : error), { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const { serviceId } = await params;
    const organizationId = getOrganizationId(request);
    const deleted = await deleteService(organizationId, serviceId);
    if (!deleted) {
      return NextResponse.json(fail("NOT_FOUND", "Service not found."), { status: 404 });
    }
    return NextResponse.json(ok({ deleted: true }));
  } catch (error) {
    return NextResponse.json(fail("SERVICE_DELETE_FAILED", "Failed to delete service.", error instanceof Error ? error.message : error), { status: 400 });
  }
}
