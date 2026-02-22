import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { createClient, listClients } from "@/lib/server/services/clients";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    const data = await listClients(organizationId);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(fail("CLIENT_LIST_FAILED", "Failed to list clients.", error instanceof Error ? error.message : error), { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await createClient(organizationId, body);
    return NextResponse.json(ok(data), { status: 201 });
  } catch (error) {
    return NextResponse.json(fail("CLIENT_CREATE_FAILED", "Failed to create client.", error instanceof Error ? error.message : error), { status: 400 });
  }
}
