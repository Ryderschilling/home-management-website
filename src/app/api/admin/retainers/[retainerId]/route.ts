import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import {
    getRetainerById,
    syncRetainerJobs,
    updateRetainer,
  } from "@/lib/server/services/retainers";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ retainerId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const { retainerId } = await params;
    const organizationId = getOrganizationId(request);
    const data = await getRetainerById(organizationId, retainerId);

    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Retainer not found."), {
        status: 404,
      });
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "RETAINER_GET_FAILED",
        error instanceof Error ? error.message : "Failed to load retainer"
      ),
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ retainerId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const { retainerId } = await params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await updateRetainer(organizationId, retainerId, body);

if (!data) {
  return NextResponse.json(fail("NOT_FOUND", "Retainer not found."), {
    status: 404,
  });
}

await syncRetainerJobs(organizationId, retainerId);

return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "RETAINER_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update retainer"
      ),
      { status: 400 }
    );
  }
}