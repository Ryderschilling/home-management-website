import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { fmtLong, fmtShort } from "@/lib/portal/dates";
import type { LineDetails } from "@/app/portal/actions/orders";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${n.toFixed(2)}`;

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const { id } = await params;
  const sp = await searchParams;
  const o = await prisma.order.findFirst({
    where: { id, clientId: viewer.client.id, status: { not: "DRAFT" } },
    include: { lines: { orderBy: { scheduledDate: "asc" }, include: { job: { select: { status: true } } } }, property: true },
  });
  if (!o) notFound();

  const plan = o.lines.find((l) => l.kind === "PLAN" && l.planTerm);
  const isNew = sp.new === "1";
  const first = viewer.client.name.split(" ")[0];

  return (
    <div className="pt-stack" style={{ gap: 22 }}>
      <div>
        <p className="pt-eyebrow">{isNew ? "All set" : "Order"}</p>
        <h1 className="pt-h1">
          {isNew
            ? o.status === "PENDING"
              ? `Got it, ${first}.`
              : `Thank you, ${first}.`
            : `Order from ${fmtShort(o.createdAt)}`}
        </h1>
        <p className="pt-lede" style={{ marginBottom: 0 }}>
          {o.status === "PAID" && "Your card was charged and your visits are on our calendar. A confirmation email is on its way."}
          {o.status === "PENDING" && (plan || Number(o.total) > 0 ? "Your visits are on our calendar. Ryder will send the invoice by email." : "Ryder will look at your request and text you a price before anything is charged.")}
          {o.status === "FAILED" && `This order did not go through${o.failureReason ? `: ${o.failureReason}` : "."} Nothing was charged.`}
          {o.status === "CANCELED" && "This order was canceled."}
        </p>
      </div>

      <div className="pt-card">
        {o.property && <p className="pt-small" style={{ marginBottom: 12 }}>For {o.property.address}</p>}
        <div className="pt-list">
          {plan && (
            <div className="pt-row">
              <div className="pt-row-main">
                <div className="pt-row-title">{plan.name}</div>
                <div className="pt-row-sub">{money(Number(plan.unitPrice))} a month, billed automatically.</div>
              </div>
              <span className="pt-row-amt">{money(Number(plan.unitPrice))}/mo</span>
            </div>
          )}
          {o.lines
            .filter((l) => !(l.kind === "PLAN" && l.planTerm))
            .map((l) => {
              const planVisit = Boolean((l.details as LineDetails | null)?.planVisit);
              return (
                <div key={l.id} className="pt-row">
                  <div className="pt-row-main">
                    <div className="pt-row-title">{l.name}</div>
                    <div className="pt-row-sub">
                      {l.scheduledDate ? fmtLong(l.scheduledDate) : ""}
                      {l.job?.status === "CANCELED" ? " · canceled" : l.job?.status === "DONE" ? " · done" : ""}
                    </div>
                  </div>
                  <span className="pt-row-amt">{planVisit ? "Included" : l.kind === "REQUEST" ? "Quote" : money(Number(l.amount))}</span>
                </div>
              );
            })}
        </div>
        <div style={{ marginTop: 10 }}>
          {Number(o.tip) > 0 && <div className="pt-total"><span>Tip, thank you</span><span>{money(Number(o.tip))}</span></div>}
          <div className="pt-total pt-total--grand"><span>{o.status === "PAID" ? "Charged" : "Total"}</span><span>{money(Number(o.total))}</span></div>
        </div>
        {o.squareReceiptUrl && (
          <p className="pt-small" style={{ marginTop: 10 }}>
            <a href={o.squareReceiptUrl} target="_blank" rel="noreferrer" style={{ color: "var(--ch-teal)", fontWeight: 600 }}>Square receipt</a>
          </p>
        )}
      </div>

      <div className="pt-btn-row">
        <Link href="/portal" className="pt-btn pt-btn--primary" style={{ width: "auto" }}>See your calendar</Link>
        <Link href="/portal/history?tab=orders" className="pt-btn" style={{ width: "auto" }}>All orders</Link>
      </div>
    </div>
  );
}
