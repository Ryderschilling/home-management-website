import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import {
  deleteClient,
  getClientById,
  updateClient,
} from "@/lib/server/services/clients";

export const runtime = "nodejs";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(request: NextRequest, context: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const organizationId = getOrganizationId(request);
    const { clientId } = await context.params;
    const data = await getClientById(organizationId, clientId);

    if (!data) {
      return NextResponse.json(
        fail("CLIENT_NOT_FOUND", "Client not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "CLIENT_GET_FAILED",
        error instanceof Error ? error.message : "Failed to load client"
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
    const { clientId } = await context.params;
    const body = await parseJsonBody(request);
    const data = await updateClient(organizationId, clientId, body);

    if (!data) {
      return NextResponse.json(
        fail("CLIENT_NOT_FOUND", "Client not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail(
        "CLIENT_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update client"
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
    const { clientId } = await context.params;
    const deleted = await deleteClient(organizationId, clientId);

    if (!deleted) {
      return NextResponse.json(
        fail("CLIENT_NOT_FOUND", "Client not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(ok({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      fail(
        "CLIENT_DELETE_FAILED",
        error instanceof Error ? error.message : "Failed to delete client"
      ),
      { status: 400 }
    );
  }
}