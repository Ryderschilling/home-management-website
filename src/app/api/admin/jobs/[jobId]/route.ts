// src/app/api/admin/jobs/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseJsonBody } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { deleteJob, getJobById, updateJob } from "@/lib/server/services/jobs";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  const { jobId } = await params;

  try {
    const organizationId = getOrganizationId(request);
    const job = await getJobById(organizationId, jobId);
    if (!job) return NextResponse.json(fail("NOT_FOUND", "Job not found."), { status: 404 });
    return NextResponse.json(ok(job));
  } catch (error) {
    return NextResponse.json(
      fail("JOB_GET_FAILED", error instanceof Error ? error.message : "Failed to get job"),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  const { jobId } = await params;

  try {
    const organizationId = getOrganizationId(request);
    const body = await parseJsonBody(request);
    const updated = await updateJob(organizationId, jobId, body);
    if (!updated) return NextResponse.json(fail("NOT_FOUND", "Job not found."), { status: 404 });
    return NextResponse.json(ok(updated));
  } catch (error) {
    return NextResponse.json(
      fail("JOB_UPDATE_FAILED", error instanceof Error ? error.message : "Failed to update job"),
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  const { jobId } = await params;

  try {
    const organizationId = getOrganizationId(request);
    const deleted = await deleteJob(organizationId, jobId);
    if (!deleted) return NextResponse.json(fail("NOT_FOUND", "Job not found."), { status: 404 });
    return NextResponse.json(ok({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      fail("JOB_DELETE_FAILED", error instanceof Error ? error.message : "Failed to delete job"),
      { status: 400 }
    );
  }
}