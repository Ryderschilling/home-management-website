import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sampleReportId } from "@/lib/sampleReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public photo route for the ONE report Ryder chose as the ad sample. Nothing else. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const reportId = await sampleReportId();
  if (!reportId) return new NextResponse("Not found", { status: 404 });
  const photo = await prisma.visitPhoto.findFirst({
    where: { id, reportId, report: { status: "FINAL" } },
    select: { data: true, mimeType: true },
  });
  if (!photo) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(photo.data), {
    headers: { "Content-Type": photo.mimeType, "Cache-Control": "public, max-age=3600" },
  });
}
