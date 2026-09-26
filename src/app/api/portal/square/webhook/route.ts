import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/portal/square";
import { sendPortalEmail, notifyRyder, appUrl } from "@/lib/portal/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Square webhook. Subscribe this URL in the Square developer dashboard:
 *   https://coastalhomemngt30a.com/api/portal/square/webhook
 * Events: payment.completed, payment.updated, subscription.updated,
 *         invoice.scheduled_charge_failed
 *
 * Keeps the shared database honest after checkout: subscription charges each
 * month become Payment rows, a paused or canceled subscription flips the plan,
 * a failed autopay emails the client and Ryder.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const url = `${(process.env.SQUARE_WEBHOOK_URL || appUrl() + "/api/portal/square/webhook").replace(/\/$/, "")}`;
  if (!verifyWebhookSignature(url, raw, req.headers.get("x-square-hmacsha256-signature"))) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let body: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const type = body.type ?? "";
  const obj = body.data?.object ?? {};

  try {
    if (type === "payment.completed" || type === "payment.updated") {
      await onPayment(obj.payment as SquarePaymentLike | undefined);
    } else if (type === "subscription.updated" || type === "subscription.created") {
      await onSubscription(obj.subscription as SquareSubLike | undefined);
    } else if (type === "invoice.scheduled_charge_failed") {
      await onChargeFailed(obj.invoice as SquareInvoiceLike | undefined);
    }
  } catch (e) {
    console.error("[square webhook]", type, e);
    // Return 200 anyway: Square retries on non-2xx, and a bug here should not
    // hammer the endpoint. The dashboard's Square sync is the backstop.
  }
  return NextResponse.json({ ok: true });
}

type SquarePaymentLike = {
  id: string;
  status?: string;
  amount_money?: { amount: number };
  tip_money?: { amount: number };
  customer_id?: string;
  reference_id?: string;
  note?: string;
  created_at?: string;
  order_id?: string;
};
type SquareSubLike = { id: string; status?: string; customer_id?: string; canceled_date?: string; charged_through_date?: string };
type SquareInvoiceLike = { id: string; subscription_id?: string; primary_recipient?: { customer_id?: string }; payment_requests?: Array<{ computed_amount_money?: { amount: number } }> };

async function onPayment(p: SquarePaymentLike | undefined) {
  if (!p?.id || p.status !== "COMPLETED") return;
  const exists = await prisma.payment.findUnique({ where: { squarePaymentId: p.id } });
  if (exists) return;

  // The checkout already wrote its own Payment row keyed by the order id.
  if (p.reference_id) {
    const order = await prisma.order.findUnique({ where: { id: p.reference_id }, select: { id: true, squarePaymentId: true } }).catch(() => null);
    if (order?.squarePaymentId === p.id) return;
  }

  const link = p.customer_id ? await prisma.squareLink.findUnique({ where: { squareCustomerId: p.customer_id } }) : null;
  const clientId = link?.clientId ?? null;
  const amount = ((p.amount_money?.amount ?? 0) + (p.tip_money?.amount ?? 0)) / 100;
  if (amount <= 0) return;
  const when = p.created_at ? new Date(p.created_at) : new Date();

  // A subscription charge may also arrive through the dashboard's invoice sync.
  // Adopt a same-client, same-amount row from the last few days instead of stacking a second one.
  if (clientId) {
    const twin = await prisma.payment.findFirst({
      where: {
        clientId,
        squarePaymentId: null,
        amount,
        status: "PAID",
        paidDate: { gte: new Date(when.getTime() - 4 * 86_400_000), lte: new Date(when.getTime() + 4 * 86_400_000) },
      },
    });
    if (twin) {
      await prisma.payment.update({ where: { id: twin.id }, data: { squarePaymentId: p.id } });
      return;
    }
  }

  const sub = clientId
    ? await prisma.planSubscription.findFirst({ where: { clientId, status: "ACTIVE", rate: amount }, select: { serviceName: true } })
    : null;

  await prisma.payment.create({
    data: {
      clientId,
      amount,
      status: "PAID",
      paidDate: when,
      method: "SQUARE",
      category: sub ? "RETAINER" : "A_LA_CARTE",
      description: sub ? `${sub.serviceName} plan, monthly autopay` : p.note || "Square payment",
      squarePaymentId: p.id,
    },
  });
}

async function onSubscription(s: SquareSubLike | undefined) {
  if (!s?.id) return;
  const sub = await prisma.planSubscription.findUnique({ where: { squareSubscriptionId: s.id }, include: { client: { select: { name: true } } } });
  if (!sub) return;
  const st = s.status ?? "";
  if ((st === "CANCELED" || st === "DEACTIVATED") && sub.status !== "CANCELED") {
    await prisma.planSubscription.update({ where: { id: sub.id }, data: { status: "CANCELED", canceledAt: new Date(), cancelReason: `Square: ${st}` } });
    await notifyRyder(`Plan ended in Square: ${sub.client.name}`, `${sub.client.name}'s ${sub.serviceName} subscription is ${st.toLowerCase()} in Square`, [
      { p: "Their portal plan is now marked canceled. Future plan visits stay on the calendar until you remove them." },
    ]);
  } else if (st === "PAUSED" && sub.status === "ACTIVE") {
    await prisma.planSubscription.update({ where: { id: sub.id }, data: { status: "PAUSED" } });
  } else if (st === "ACTIVE" && sub.status === "PAUSED") {
    await prisma.planSubscription.update({ where: { id: sub.id }, data: { status: "ACTIVE", lastPaymentFailedAt: null } });
  }
}

async function onChargeFailed(inv: SquareInvoiceLike | undefined) {
  if (!inv?.subscription_id) return;
  const sub = await prisma.planSubscription.findUnique({
    where: { squareSubscriptionId: inv.subscription_id },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  if (!sub) return;
  await prisma.planSubscription.update({ where: { id: sub.id }, data: { lastPaymentFailedAt: new Date() } });
  await prisma.task.create({
    data: { title: `Autopay failed for ${sub.client.name} (${sub.serviceName}). Square will retry; check the card.`, priority: "HIGH", clientId: sub.client.id, dueDate: new Date() },
  });
  if (sub.client.email) {
    await sendPortalEmail({
      to: sub.client.email,
      subject: "Your Coastal Home Management payment did not go through",
      heading: `${sub.client.name.split(" ")[0]}, quick one about your card`,
      blocks: [
        { p: `This month's payment for your ${sub.serviceName} plan was declined. Square will try again in a few days. If your card has changed, update it from your account and we will get you sorted.` },
        { button: { label: "Open my account", href: `${appUrl()}/portal/account` } },
        { p: "Your visits are not affected. Text Ryder with any questions." },
      ],
    });
  }
  await notifyRyder(`Autopay failed: ${sub.client.name}`, `${sub.client.name}'s ${sub.serviceName} autopay was declined`, [{ p: "Square will retry automatically. The client was emailed. A task is on your list." }]);
}
