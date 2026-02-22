import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { deleteClient, updateClient } from "@/lib/server/services/clients";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const { clientId } = await params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await updateClient(organizationId, clientId, body);
    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Client not found."), { status: 404 });
    }
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(fail("CLIENT_UPDATE_FAILED", "Failed to update client.", error instanceof Error ? error.message : error), { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const { clientId } = await params;
    const organizationId = getOrganizationId(request);
    const deleted = await deleteClient(organizationId, clientId);
    if (!deleted) {
      return NextResponse.json(fail("NOT_FOUND", "Client not found."), { status: 404 });
    }
    return NextResponse.json(ok({ deleted: true }));
  } catch (error) {
    return NextResponse.json(fail("CLIENT_DELETE_FAILED", "Failed to delete client.", error instanceof Error ? error.message : error), { status: 400 });
  }
}
