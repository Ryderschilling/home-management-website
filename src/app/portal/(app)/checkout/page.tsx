import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { squareConfigured, squareEnv } from "@/lib/portal/square";
import { dayKey } from "@/lib/portal/dates";
import CheckoutForm, { type CheckoutView } from "@/components/portal/CheckoutForm";
import type { LineDetails } from "@/app/portal/actions/orders";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");

  const [draft, agreement] = await Promise.all([
    prisma.order.findFirst({ where: { clientId: viewer.client.id, status: "DRAFT" }, include: { lines: { orderBy: { scheduledDate: "asc" } }, property: true } }),
    prisma.agreementVersion.findFirst({ orderBy: { effectiveAt: "desc" } }),
  ]);

  if (!draft || draft.lines.length === 0) {
    return (
      <div className="pt-card" style={{ textAlign: "center", padding: 40 }}>
        <h1 className="pt-h2">Your order is empty</h1>
        <p className="pt-muted" style={{ marginBottom: 20 }}>Pick a plan or a service from your calendar first.</p>
        <Link href="/portal" className="pt-btn pt-btn--primary" style={{ width: "auto" }}>Back to the calendar</Link>
      </div>
    );
  }

  const plan = draft.lines.find((l) => l.kind === "PLAN" && l.planTerm);
  const chargeToday = draft.lines.reduce((a, l) => a + Number(l.amount), 0);
  const requestOnly = !plan && chargeToday === 0 && draft.lines.every((l) => l.kind === "REQUEST");

  const isLock = plan?.planTerm === "LOCK12";
  const planRate = plan ? Number(plan.unitPrice) : 0;
  const planBase = plan ? plan.name.replace(/ plan.*$/, "") : "";
  const oneTime = chargeToday - (plan && !isLock ? planRate : 0);
  const planDesc = plan ? (isLock ? `${planBase} plan at $${planRate.toFixed(0)} per month` : `${plan.name} (one month) at $${planRate.toFixed(0)}`) : null;
  const feeDesc = [
    plan ? (isLock ? `$${planRate.toFixed(0)} per month for the ${planBase} plan, billed to the card on file` : `$${planRate.toFixed(0)} for the ${plan.name}, charged today`) : null,
    oneTime > 0 ? `$${oneTime.toFixed(2)} for the one-time services in this order` : null,
  ]
    .filter(Boolean)
    .join(", and ");

  const body = (agreement?.body ?? "")
    .replace(/\{\{plan\}\}/g, planDesc ?? draft.lines.map((l) => l.name).filter((n, i, a) => a.indexOf(n) === i).join(", "))
    .replace(/\{\{fee\}\}/g, feeDesc || "the amounts shown at checkout")
    .replace(/\{\{term\}\}/g, plan ? (isLock ? "12-month locked rate, billed monthly, $150 early cancellation fee" : "one month, paid in advance, renewed month by month") : "one-time");

  const view: CheckoutView = {
    orderId: draft.id,
    clientName: viewer.client.name,
    address: draft.property?.address ?? null,
    plan: plan ? { name: plan.name, rate: planRate, term: plan.planTerm as "MONTHLY" | "LOCK12" } : null,
    lines: draft.lines
      .filter((l) => !(l.kind === "PLAN" && l.planTerm))
      .map((l) => ({
        id: l.id,
        name: l.name,
        day: l.scheduledDate ? dayKey(l.scheduledDate) : null,
        amount: Number(l.amount),
        kind: l.kind,
        planVisit: Boolean((l.details as LineDetails | null)?.planVisit),
      })),
    chargeToday,
    requestOnly,
    needsCard: (Boolean(plan) || chargeToday > 0) && squareConfigured(),
    invoiceLater: (Boolean(plan) || chargeToday > 0) && !squareConfigured(),
    agreement: agreement ? { version: agreement.version, title: agreement.title, body } : null,
    square: {
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "",
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? process.env.SQUARE_LOCATION_ID ?? "",
      env: (process.env.NEXT_PUBLIC_SQUARE_ENV as "sandbox" | "production" | undefined) ?? squareEnv(),
    },
  };

  return <CheckoutForm view={view} />;
}
