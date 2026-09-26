import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A visit photo, only for the client it belongs to, only from a FINAL report. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const photo = await prisma.visitPhoto.findFirst({
    where: { id, report: { clientId: viewer.client.id, status: "FINAL" } },
    select: { data: true, mimeType: true },
  });
  if (!photo) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
