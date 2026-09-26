import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { fmtShort, daysAgo } from "@/lib/portal/dates";
import * as square from "@/lib/portal/square";
import ContactForm from "@/components/portal/ContactForm";
import PasswordForm from "@/components/portal/PasswordForm";
import PlanCard from "@/components/portal/PlanCard";
import BillingCard, { type BillingView } from "@/components/portal/BillingCard";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const clientId = viewer.client.id;

  const [subs, client, properties, due, recent, link] = await Promise.all([
    prisma.planSubscription.findMany({
      where: { clientId, status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { createdAt: "desc" },
      include: { property: { select: { address: true } } },
    }),
    prisma.client.findUnique({ where: { id: clientId }, select: { planName: true, planAmount: true, cadence: true, status: true, lockedUntil: true } }),
    prisma.property.count({ where: { clientId } }),
    prisma.payment.findMany({ where: { clientId, status: "DUE" }, orderBy: { dueDate: "asc" } }),
    prisma.payment.findMany({
      where: { clientId, status: { in: ["PAID", "UPCOMING"] }, createdAt: { gte: daysAgo(365) } },
      orderBy: [{ paidDate: "desc" }, { dueDate: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.squareLink.findFirst({ where: { clientId } }),
  ]);

  const legacyPlan =
    subs.length === 0 && client && client.status === "ACTIVE" && client.cadence === "MONTHLY" && client.planAmount && Number(client.planAmount) > 0
      ? { name: client.planName ?? "Home watch plan", rate: Number(client.planAmount), lockedUntil: client.lockedUntil ? fmtShort(client.lockedUntil) : null }
      : null;

  // Card on file and next charge come straight from Square, never guessed.
  const squareOn = square.squareConfigured();
  let card: BillingView["card"] = null;
  let nextCharge: BillingView["nextCharge"] = null;
  const lock = subs.find((s) => s.term === "LOCK12" && s.status === "ACTIVE");
  const monthly = subs.find((s) => s.term === "MONTHLY" && s.status === "ACTIVE");
  if (squareOn) {
    const customerId = subs.find((s) => s.squareCustomerId)?.squareCustomerId ?? link?.squareCustomerId ?? null;
    if (customerId) {
      try {
        const cards = await square.listCards(customerId);
        const c = cards.find((x) => x.id === lock?.squareCardId) ?? cards[0];
        if (c) {
          const brand = (c.card_brand ?? "Card").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
          card = { brand, last4: c.last_4 ?? "", exp: c.exp_month && c.exp_year ? `${String(c.exp_month).padStart(2, "0")}/${String(c.exp_year).slice(-2)}` : "" };
        }
      } catch (e) {
        console.error("[portal] listCards", e);
      }
    }
    if (lock?.squareSubscriptionId) {
      try {
        const s = await square.getSubscription(lock.squareSubscriptionId);
        if (s.charged_through_date) {
          // Square bills the day after charged_through.
          const [y, m, d] = s.charged_through_date.split("-").map(Number);
          const next = new Date(Date.UTC(y, m - 1, d + 1, 12));
          nextCharge = { date: fmtShort(next), amount: Number(lock.rate) };
        }
      } catch (e) {
        console.error("[portal] getSubscription", e);
      }
    }
  }

  const billing: BillingView = {
    card,
    nextCharge,
    paidThrough: monthly?.endDate ? fmtShort(monthly.endDate) : null,
    due: due.map((p) => ({ id: p.id, amount: Number(p.amount), dueDate: p.dueDate ? fmtShort(p.dueDate) : null, description: p.description ?? "Invoice", invoiceNumber: p.invoiceNumber })),
    recent: recent.map((p) => ({ id: p.id, amount: Number(p.amount), date: fmtShort(p.paidDate ?? p.dueDate ?? p.createdAt), description: p.description ?? "Payment", status: p.status })),
    failedOn: subs.find((s) => s.lastPaymentFailedAt)?.lastPaymentFailedAt ? fmtShort(subs.find((s) => s.lastPaymentFailedAt)!.lastPaymentFailedAt as Date) : null,
    squareOn,
    square: {
      appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "",
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? process.env.SQUARE_LOCATION_ID ?? "",
      env: (process.env.NEXT_PUBLIC_SQUARE_ENV as "sandbox" | "production" | undefined) ?? square.squareEnv(),
    },
  };

  return (
    <div className="pt-stack" style={{ gap: 28 }}>
      <div>
        <p className="pt-eyebrow">Account</p>
        <h1 className="pt-h1">Your account</h1>
        <p className="pt-lede" style={{ marginBottom: 0 }}>
          Your plan, billing, and how to reach you. Access codes and house details live under{" "}
          <Link href="/portal/home" style={{ color: "var(--ch-teal)", fontWeight: 600 }}>My Home</Link>
          {properties === 0 ? ", where you can add your home" : ""}.
        </p>
      </div>

      <section>
        <h2 className="pt-h2">Your plan</h2>
        {subs.length > 0 ? (
          <div className="pt-stack">
            {subs.map((sub) => (
              <PlanCard
                key={sub.id}
                sub={{
                  id: sub.id,
                  serviceName: sub.serviceName,
                  term: sub.term,
                  rate: Number(sub.rate),
                  visitsPerMonth: sub.visitsPerMonth,
                  preferredWeekday: sub.preferredWeekday,
                  weekOrdinals: sub.weekOrdinals ?? [],
                  startDate: fmtShort(sub.startDate),
                  endDate: sub.endDate ? fmtShort(sub.endDate) : null,
                  status: sub.status,
                  address: sub.property?.address ?? null,
                  onSquare: Boolean(sub.squareSubscriptionId),
                  lastPaymentFailedAt: sub.lastPaymentFailedAt ? fmtShort(sub.lastPaymentFailedAt) : null,
                }}
              />
            ))}
          </div>
        ) : legacyPlan ? (
          <div className="pt-card">
            <p className="pt-eyebrow" style={{ marginBottom: 4 }}>{legacyPlan.lockedUntil ? "Locked rate" : "Monthly"}</p>
            <h3 className="pt-h2" style={{ marginBottom: 4 }}>{legacyPlan.name}</h3>
            <p className="pt-muted">
              {money(legacyPlan.rate)} a month{legacyPlan.lockedUntil ? `, rate locked through ${legacyPlan.lockedUntil}` : ""}. Billed by invoice from Coastal Home Management. Text Ryder to change anything about it.
            </p>
          </div>
        ) : (
          <div className="pt-card" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <p className="pt-muted" style={{ margin: 0 }}>No plan yet. Pick one from your calendar and choose your visit days.</p>
            <Link href="/portal" className="pt-btn pt-btn--primary pt-btn--sm" style={{ width: "auto" }}>See plans</Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="pt-h2">Billing</h2>
        <BillingCard b={billing} />
      </section>

      <section>
        <h2 className="pt-h2">Contact details</h2>
        <div className="pt-card">
          <ContactForm name={viewer.client.name} email={viewer.user.email} phone={viewer.client.phone ?? ""} altContact={viewer.client.altContact ?? ""} />
        </div>
      </section>

      <section>
        <h2 className="pt-h2">Login and password</h2>
        <div className="pt-card">
          <p className="pt-small" style={{ marginBottom: 14 }}>You sign in as <strong>{viewer.user.email}</strong>. Text Ryder if that email needs to change.</p>
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
