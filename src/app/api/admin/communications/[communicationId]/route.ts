import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import {
  getCommunicationById,
  updateCommunication,
} from "@/lib/server/services/communications";

export const runtime = "nodejs";

type Params = { params: Promise<{ communicationId: string }> };

export async function GET(request: NextRequest, context: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const { communicationId } = await context.params;
    const data = await getCommunicationById(organizationId, communicationId);

    if (!data) {
      return NextResponse.json(
        fail("COMMUNICATION_NOT_FOUND", "Communication not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "COMMUNICATION_GET_FAILED",
        error instanceof Error ? error.message : "Failed to load communication"
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
    const { communicationId } = await context.params;
    const body = await parseJsonBody(request);
    const data = await updateCommunication(organizationId, communicationId, body);

    if (!data) {
      return NextResponse.json(
        fail("COMMUNICATION_NOT_FOUND", "Communication not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "COMMUNICATION_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update communication"
      ),
      { status: 400 }
    );
  }
}
