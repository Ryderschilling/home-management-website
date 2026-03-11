import { NextRequest, NextResponse } from "next/server";
import { fail, ok } from "@/lib/server/api";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(
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
    await ensureAdminTables();

    const { jobId } = await params;
    const organizationId = getOrganizationId(request);

    const existingJob = await sql`
      SELECT id
      FROM admin_jobs
      WHERE organization_id = ${organizationId} AND id = ${jobId}
      LIMIT 1
    `;

    if (!existingJob[0]) {
      return NextResponse.json(fail("NOT_FOUND", "Job not found."), { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("photo");
    const caption = safe(form.get("caption")) || null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        fail("BAD_REQUEST", "Missing photo file."),
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        fail("BAD_REQUEST", "Photo must be an image."),
        { status: 400 }
      );
    }

    if (file.size > env.JOB_PHOTO_MAX_BYTES) {
      return NextResponse.json(
        fail("BAD_REQUEST", `Photo too large (max ${Math.floor(env.JOB_PHOTO_MAX_BYTES / (1024 * 1024))}MB).`),
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const inserted = await sql`
      INSERT INTO admin_job_photos (
        id,
        job_id,
        url,
        caption
      )
      VALUES (
        ${crypto.randomUUID()},
        ${jobId},
        ${dataUrl},
        ${caption || file.name || "Job photo"}
      )
      RETURNING id, job_id, url, caption, uploaded_at
    `;

    return NextResponse.json(ok(inserted[0]));
  } catch (error) {
    return NextResponse.json(
      fail(
        "JOB_PHOTO_UPLOAD_FAILED",
        error instanceof Error ? error.message : "Failed to upload photo"
      ),
      { status: 400 }
    );
  }
}