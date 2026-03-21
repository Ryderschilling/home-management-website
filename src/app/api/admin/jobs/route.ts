import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { createJob, listJobs } from "@/lib/server/services/jobs";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), {
      status: 401,
    });
  }

  try {
    const organizationId = getOrganizationId(request);
    const { searchParams } = new URL(request.url);
    const data = await listJobs(organizationId, {
      start: searchParams.get("start"),
      end: searchParams.get("end"),
      status: searchParams.get("status"),
      clientId: searchParams.get("clientId"),
      propertyId: searchParams.get("propertyId"),
      includeCompleted:
        searchParams.get("includeCompleted") === "true" ||
        searchParams.get("includeCompleted") === "1",
    });
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail("JOBS_LIST_FAILED", error instanceof Error ? error.message : "Failed to list jobs"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), {
      status: 401,
    });
  }

  try {
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await createJob(organizationId, body);
    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail("JOB_CREATE_FAILED", error instanceof Error ? error.message : "Failed to create job"),
      { status: 400 }
    );
  }
}
