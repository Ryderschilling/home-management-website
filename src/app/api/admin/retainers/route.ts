import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import {
    createRetainer,
    listRetainers,
    syncRetainerJobs,
  } from "@/lib/server/services/retainers";

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
    const data = await listRetainers(organizationId);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "RETAINERS_LIST_FAILED",
        error instanceof Error ? error.message : "Failed to list retainers"
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
    const data = await createRetainer(organizationId, body);
await syncRetainerJobs(organizationId, data.id);
return NextResponse.json(ok(data), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      fail(
        "RETAINER_CREATE_FAILED",
        error instanceof Error ? error.message : "Failed to create retainer"
      ),
      { status: 400 }
    );
  }
}