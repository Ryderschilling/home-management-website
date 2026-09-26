import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { fmtShort, fmtTime, daysAgo } from "@/lib/portal/dates";

export const dynamic = "force-dynamic";

const CATEGORY: Record<string, string> = {
  RETAINER: "Monthly plan",
  A_LA_CARTE: "One-time service",
  PROJECT: "Project",
  ADD_ON: "Add-on",
  OTHER: "Payment",
};

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const sp = await searchParams;
  const tab = sp.tab === "payments" ? "payments" : sp.tab === "orders" ? "orders" : "visits";
  const clientId = viewer.client.id;

  const [jobs, payments, orders] = await Promise.all([
    prisma.job.findMany({
      where: { clientId, date: { lte: daysAgo(0) } },
      orderBy: { date: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        jobType: true,
        date: true,
        status: true,
        allDay: true,
        property: { select: { address: true } },
        visitReport: { select: { id: true, status: true, summary: true, photos: { select: { id: true }, take: 1 } } },
        orderLine: { select: { name: true } },
        subscription: { select: { serviceName: true } },
      },
    }),
    prisma.payment.findMany({
      where: { clientId },
      orderBy: [{ paidDate: "desc" }, { dueDate: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.order.findMany({
      where: { clientId, status: { in: ["PAID", "PENDING", "FAILED", "CANCELED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { lines: { select: { name: true, scheduledDate: true, kind: true } } },
    }),
  ]);

  const tabLink = (id: string, label: string) => (
    <Link key={id} href={`/portal/history?tab=${id}`} className={`pt-btn pt-btn--sm ${tab === id ? "pt-btn--dark" : ""}`} style={{ width: "auto" }}>
      {label}
    </Link>
  );

  return (
    <div className="pt-stack" style={{ gap: 24 }}>
      <div>
        <p className="pt-eyebrow">History</p>
        <h1 className="pt-h1">Everything we have done</h1>
        <p className="pt-lede">Every visit, every report, every payment. Nothing here is typed by hand.</p>
      </div>

      <div className="pt-btn-row">
        {tabLink("visits", `Visits (${jobs.length})`)}
        {tabLink("payments", `Payments (${payments.length})`)}
        {tabLink("orders", `Orders (${orders.length})`)}
      </div>

      {tab === "visits" && (
        <div className="pt-card pt-card--tight">
          {jobs.length === 0 ? (
            <p className="pt-muted" style={{ padding: "18px 0" }}>No visits yet. Once we have been by, each one shows up here with its report.</p>
          ) : (
            <div className="pt-list">
              {jobs.map((j) => {
                const report = j.visitReport && j.visitReport.status === "FINAL" ? j.visitReport : null;
                return (
                  <div key={j.id} className="pt-row">
                    <div className="pt-row-main">
                      <div className="pt-row-title">{j.orderLine?.name ?? (j.subscription ? `${j.subscription.serviceName} visit` : null) ?? j.jobType ?? j.title}</div>
                      <div className="pt-row-sub">
                        {fmtShort(j.date)}
                        {!j.allDay ? ` at ${fmtTime(j.date)}` : ""}
                        {j.property?.address ? ` · ${j.property.address}` : ""}
                        {report?.summary ? ` · ${report.summary.slice(0, 90)}${report.summary.length > 90 ? "..." : ""}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {j.status === "CANCELED" ? (
                        <span className="pt-badge pt-badge--mut">Canceled</span>
                      ) : report ? (
                        <Link href={`/portal/reports/${report.id}`} className="pt-btn pt-btn--sm pt-btn--primary" style={{ width: "auto" }}>
                          View report
                        </Link>
                      ) : j.status === "DONE" ? (
                        <span className="pt-badge pt-badge--teal">Done</span>
                      ) : (
                        <span className="pt-badge pt-badge--mut">Scheduled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="pt-card pt-card--tight">
          {payments.length === 0 ? (
            <p className="pt-muted" style={{ padding: "18px 0" }}>No payments on file yet.</p>
          ) : (
            <div className="pt-list">
              {payments.map((p) => {
                const when = p.paidDate ?? p.dueDate ?? p.createdAt;
                const overdue = p.status === "DUE" && p.dueDate && p.dueDate < daysAgo(0);
                return (
                  <div key={p.id} className="pt-row">
                    <div className="pt-row-main">
                      <div className="pt-row-title">{p.description || CATEGORY[p.category] || "Payment"}</div>
                      <div className="pt-row-sub">
                        {p.status === "PAID" ? "Paid " : p.status === "DUE" ? "Due " : "Scheduled "}
                        {fmtShort(when)}
                        {p.invoiceNumber ? ` · Invoice ${p.invoiceNumber}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span className={`pt-badge ${p.status === "PAID" ? "pt-badge--teal" : overdue ? "pt-badge--bad" : "pt-badge--warn"}`}>
                        {p.status === "PAID" ? "Paid" : overdue ? "Past due" : p.status === "DUE" ? "Due" : "Upcoming"}
                      </span>
                      <span className="pt-row-amt">${Number(p.amount).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="pt-card pt-card--tight">
          {orders.length === 0 ? (
            <p className="pt-muted" style={{ padding: "18px 0" }}>No orders yet. Book something from the calendar and it will show up here.</p>
          ) : (
            <div className="pt-list">
              {orders.map((o) => (
                <div key={o.id} className="pt-row">
                  <div className="pt-row-main">
                    <div className="pt-row-title">
                      {Array.from(new Set(o.lines.map((l) => l.name))).join(", ") || "Order"}
                    </div>
                    <div className="pt-row-sub">
                      {fmtShort(o.createdAt)} · {o.lines.filter((l) => l.scheduledDate).length} day{o.lines.filter((l) => l.scheduledDate).length === 1 ? "" : "s"} booked
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span className={`pt-badge ${o.status === "PAID" ? "pt-badge--teal" : o.status === "PENDING" ? "pt-badge--warn" : "pt-badge--mut"}`}>
                      {o.status === "PAID" ? "Paid" : o.status === "PENDING" ? (Number(o.total) > 0 ? "Invoice coming" : "Awaiting quote") : o.status === "FAILED" ? "Card declined" : "Canceled"}
                    </span>
                    <Link href={`/portal/orders/${o.id}`} className="pt-btn pt-btn--sm" style={{ width: "auto" }}>Details</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
