import { NextRequest, NextResponse } from "next/server";

import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { createJob, listJobs } from "@/lib/server/services/jobs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);

    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    const opts =
      start && end
        ? { start: new Date(start), end: new Date(end) }
        : undefined;

    const data = await listJobs(organizationId, opts);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail("JOB_LIST_FAILED", "Failed to list jobs.", error instanceof Error ? error.message : error),
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  try {
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await createJob(organizationId, body);
    return NextResponse.json(ok(data), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      fail("JOB_CREATE_FAILED", "Failed to create job.", error instanceof Error ? error.message : error),
      { status: 400 }
    );
  }
}