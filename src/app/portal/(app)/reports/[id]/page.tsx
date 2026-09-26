import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { fmtLong } from "@/lib/portal/dates";
import { LEGAL_DISCLAIMER } from "@/data/protection";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const { id } = await params;

  // FINAL only. A draft must never reach a client.
  const r = await prisma.visitReport.findFirst({
    where: { id, clientId: viewer.client.id, status: "FINAL" },
    include: {
      property: { select: { address: true } },
      findings: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" }, select: { id: true, caption: true, width: true, height: true } },
    },
  });
  if (!r) notFound();

  const issues = r.findings.filter((f) => f.state === "ISSUE");
  const groups = new Map<string, typeof r.findings>();
  for (const f of r.findings) {
    const list = groups.get(f.category) ?? [];
    list.push(f);
    groups.set(f.category, list);
  }

  return (
    <div className="pt-stack" style={{ gap: 22 }}>
      <div>
        <Link href="/portal/history" className="pt-btn pt-btn--ghost pt-btn--sm" style={{ width: "auto", paddingLeft: 0 }}>
          &larr; All visits
        </Link>
        <p className="pt-eyebrow" style={{ marginTop: 10 }}>Visit report</p>
        <h1 className="pt-h1">{fmtLong(r.visitDate)}</h1>
        <p className="pt-lede" style={{ marginBottom: 0 }}>
          {r.property?.address ?? ""}
          {r.weather ? ` · ${r.weather}` : ""}
        </p>
      </div>

      <div className={`pt-alert ${issues.length ? "pt-alert--note" : "pt-alert--ok"}`} style={{ fontSize: 17 }}>
        {issues.length === 0
          ? "Everything checked was dry and in good order."
          : `${issues.length} thing${issues.length === 1 ? "" : "s"} needed attention. Details below.`}
      </div>

      {r.summary && (
        <div className="pt-card">
          <h2 className="pt-h3">From Ryder</h2>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{r.summary}</p>
        </div>
      )}

      {r.photos.length > 0 && (
        <section>
          <h2 className="pt-h2">Photos</h2>
          <div className="pt-grid-2">
            {r.photos.map((p) => (
              <figure key={p.id} style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/portal/photo/${p.id}`} alt={p.caption ?? "Visit photo"} className="pt-report-photo" loading="lazy" width={p.width ?? undefined} height={p.height ?? undefined} />
                {p.caption && <figcaption className="pt-small" style={{ marginTop: 6 }}>{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {r.findings.length > 0 && (
        <section>
          <h2 className="pt-h2">What we checked</h2>
          <div className="pt-stack">
            {Array.from(groups.entries()).map(([cat, list]) => (
              <div key={cat} className="pt-card pt-card--tight">
                <h3 className="pt-h3">{cat}</h3>
                <div className="pt-list">
                  {list.map((f) => (
                    <div key={f.id} className="pt-finding">
                      <span className={`pt-finding-dot ${f.state === "ISSUE" ? "pt-finding-dot--issue" : f.state === "NA" ? "pt-finding-dot--na" : ""}`} aria-hidden="true" />
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {f.label}
                          <span className="pt-small" style={{ fontWeight: 400 }}>
                            {" "}
                            {f.state === "OK" ? "Dry, good" : f.state === "ISSUE" ? "Needs attention" : "Not applicable"}
                          </span>
                        </div>
                        {f.note && <div className="pt-small">{f.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="pt-small" style={{ lineHeight: 1.6 }}>{LEGAL_DISCLAIMER}</p>
    </div>
  );
}
