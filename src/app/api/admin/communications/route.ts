import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import {
  createCommunication,
  listCommunications,
} from "@/lib/server/services/communications";

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
    const { searchParams } = new URL(request.url);
    const data = await listCommunications(organizationId, {
      status: searchParams.get("status"),
      clientId: searchParams.get("clientId"),
      awaitingApproval:
        searchParams.get("awaitingApproval") === "true" ||
        searchParams.get("awaitingApproval") === "1",
      includeResolved:
        searchParams.get("includeResolved") === "true" ||
        searchParams.get("includeResolved") === "1",
      query: searchParams.get("query"),
    });
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "COMMUNICATIONS_LIST_FAILED",
        error instanceof Error ? error.message : "Failed to list communications"
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
    const data = await createCommunication(organizationId, body);
    return NextResponse.json(ok(data), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      fail(
        "COMMUNICATION_CREATE_FAILED",
        error instanceof Error ? error.message : "Failed to create communication"
      ),
      { status: 400 }
    );
  }
}
