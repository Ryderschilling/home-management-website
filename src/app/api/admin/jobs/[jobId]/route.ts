import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { getJobById, updateJob } from "@/lib/server/services/jobs";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const { jobId } = await params;
    const organizationId = getOrganizationId(request);
    const data = await getJobById(organizationId, jobId);

    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Job not found."), { status: 404 });
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail("JOB_GET_FAILED", error instanceof Error ? error.message : "Failed to load job"),
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "Admin authentication required."),
      { status: 401 }
    );
  }

  try {
    const { jobId } = await params;
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const data = await updateJob(organizationId, jobId, body);

    if (!data) {
      return NextResponse.json(fail("NOT_FOUND", "Job not found."), { status: 404 });
    }

    return NextResponse.json(ok(data));
  } catch (error) {
    return NextResponse.json(
      fail("JOB_UPDATE_FAILED", error instanceof Error ? error.message : "Failed to update job"),
      { status: 400 }
    );
  }
}