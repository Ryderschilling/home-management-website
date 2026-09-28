import { prisma } from "@/lib/prisma";

/**
 * The real visit report the Away on 30A opt-in gets. Ryder picks it in CHM Ops
 * (Visits, open a FINAL report, "Use as ad sample"), which writes its id to
 * AppState `sampleReportId` in the shared database. Only that one report, only
 * FINAL, and never the client's name or street address.
 */
export async function sampleReportId(): Promise<string | null> {
  const row = await prisma.appState.findUnique({ where: { key: "sampleReportId" } }).catch(() => null);
  return row?.value || null;
}

export async function loadSampleReport() {
  const id = await sampleReportId();
  if (!id) return null;
  const r = await prisma.visitReport
    .findFirst({
      where: { id, status: "FINAL" },
      include: {
        client: { select: { community: true } },
        property: { select: { address: true } },
        findings: { orderBy: { sortOrder: "asc" } },
        photos: { orderBy: { sortOrder: "asc" }, select: { id: true, caption: true, width: true, height: true }, take: 12 },
      },
    })
    .catch(() => null);
  if (!r) return null;
  // Town only: "45 Windrow Way, Inlet Beach" -> "Inlet Beach".
  const parts = (r.property?.address ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const town = r.client?.community || (parts.length > 1 ? parts[parts.length - 1].replace(/\s*FL.*$/i, "") : "") || "30A";
  return { ...r, town };
}
