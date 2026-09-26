"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getViewer, requestIp, requestUserAgent } from "@/lib/portal/session";
import { assertBookable, planAllowance, monthAvailability, patternDays, patternLabel } from "@/lib/portal/rules";
import { dayKey, keyToDate, keyToVisitTime, addDaysKey, isDayKey, isEditableKey, fmtLong, fmtShort, fmtMonth, todayKey, addMonths, currentMonthKey, daysInMonth } from "@/lib/portal/dates";
import { parseServiceNotes, serviceNotesText, type ServiceNotes } from "@/lib/portal/serviceNotes";
import { quickSaveAccess } from "./account";
import { pushJobsToCalendar } from "@/lib/portal/dashboardBridge";
import { sendPortalEmail, notifyRyder, appUrl, type MailBlock } from "@/lib/portal/email";
import * as square from "@/lib/portal/square";
import type { ActionState } from "./auth";

/* ------------------------------------------------------------------ types */

export type LineDetails = {
  groupId: string;
  propertyId: string | null;
  answer?: string;
  planTerm?: "MONTHLY" | "LOCK12";
  preferredWeekday?: number | null;
  /** LOCK12: which weeks of the month, [1,3] / [2,4] / [] for every week. */
  weekOrdinals?: number[];
  /** MONTHLY: the "YYYY-MM" this purchase covers. */
  month?: string;
  /** true on the visit rows that belong to a plan line */
  planVisit?: boolean;
};

export type CartResult = { ok: true; count: number } | { ok: false; error: string };

const s = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string).trim() : "");
const cents = (n: number | Prisma.Decimal) => Math.round(Number(n) * 100);

async function viewerOrLogin() {
  const v = await getViewer();
  if (!v) redirect("/portal/login");
  return v;
}

async function ownedProperty(clientId: string, propertyId: string) {
  const p = await prisma.property.findFirst({ where: { id: propertyId, clientId } });
  if (!p) throw new Error("Pick which home this is for.");
  return p;
}

/** Does this client have a live plan? Decides the on-plan add-on price. */
async function hasActivePlan(clientId: string): Promise<boolean> {
  const n = await prisma.planSubscription.count({ where: { clientId, status: "ACTIVE" } });
  if (n > 0) return true;
  // Legacy clients billed by invoice: a MONTHLY cadence with a plan amount counts.
  const c = await prisma.client.findUnique({ where: { id: clientId }, select: { status: true, cadence: true, planAmount: true } });
  return Boolean(c && c.status === "ACTIVE" && c.cadence === "MONTHLY" && c.planAmount && Number(c.planAmount) > 0);
}

async function getDraft(clientId: string) {
  const existing = await prisma.order.findFirst({ where: { clientId, status: "DRAFT" }, orderBy: { createdAt: "desc" } });
  return existing ?? prisma.order.create({ data: { clientId, status: "DRAFT" } });
}

async function recalc(orderId: string) {
  const lines = await prisma.orderLine.findMany({ where: { orderId } });
  const subtotal = lines.reduce((a, l) => a + Number(l.amount), 0);
  const o = await prisma.order.findUnique({ where: { id: orderId }, select: { tip: true } });
  const tip = Number(o?.tip ?? 0);
  await prisma.order.update({ where: { id: orderId }, data: { subtotal, total: subtotal + tip } });
}

/* ------------------------------------------------------------ add to cart */

export async function addPlanToCart(input: {
  serviceCode: string;
  term: "MONTHLY" | "LOCK12";
  propertyId: string;
  /** MONTHLY: the exact days picked for that month. */
  days?: string[];
  /** LOCK12: the usual day and which weeks. */
  pattern?: { weekday: number; ordinals: number[]; startMonth: string };
  answer: string;
  access: { gateCode?: string; doorCode?: string; alarmCode?: string; keyLocation?: string; serviceNotes?: ServiceNotes };
}): Promise<CartResult> {
  try {
    const v = await viewerOrLogin();
    const svc = await prisma.serviceCatalog.findUnique({ where: { code: input.serviceCode } });
    if (!svc || !svc.active || svc.kind !== "PLAN") return { ok: false, error: "That plan is not available right now." };
    const property = await ownedProperty(v.client.id, input.propertyId);
    const perMonth = svc.visitsPerMonth ?? 1;

    let days: string[] = [];
    let preferredWeekday: number | null = null;
    let ordinals: number[] = [];
    let month: string | undefined;

    if (input.term === "LOCK12") {
      const locked = await prisma.planSubscription.count({ where: { clientId: v.client.id, status: "ACTIVE", term: "LOCK12" } });
      if (locked > 0) return { ok: false, error: "You already have a 12-month plan. Text Ryder to change it." };
      const p = input.pattern;
      if (!p || !(p.weekday >= 0 && p.weekday <= 6)) return { ok: false, error: "Pick your usual visit day." };
      ordinals = perMonth >= 4 ? [] : (p.ordinals ?? []).filter((o) => o >= 1 && o <= 5).slice(0, perMonth);
      if (perMonth < 4 && ordinals.length !== perMonth) return { ok: false, error: `Pick which ${perMonth} weeks of the month.` };
      preferredWeekday = p.weekday;
      month = /^\d{4}-\d{2}$/.test(p.startMonth) ? p.startMonth : currentMonthKey();
      const avail = await monthAvailability(month);
      days = patternDays(avail, p.weekday, ordinals);
      if (days.length === 0) {
        // Nothing left this month on that day (e.g. it is the 28th). Start next month.
        month = addMonths(month, 1);
        days = patternDays(await monthAvailability(month), p.weekday, ordinals);
      }
      if (days.length === 0) return { ok: false, error: "We are not on the route that day. Pick one of the open days." };
    } else {
      days = Array.from(new Set((input.days ?? []).filter(isDayKey))).sort();
      if (days.length === 0) return { ok: false, error: "Pick your visit days." };
      if (days.length > perMonth) return { ok: false, error: `This plan includes ${perMonth} visits a month. Pick up to ${perMonth} days.` };
      const months = new Set(days.map((d) => d.slice(0, 7)));
      if (months.size > 1) return { ok: false, error: "A month-to-month plan covers one month. Pick days in the same month, then renew for the next one." };
      month = days[0].slice(0, 7);
      for (const d of days) await assertBookable(d);
      const covered = await prisma.planSubscription.findFirst({
        where: { clientId: v.client.id, status: "ACTIVE", OR: [{ term: "LOCK12" }, { term: "MONTHLY", endDate: { gte: keyToDate(`${month}-01`) }, startDate: { lt: keyToDate(addDaysKey(`${month}-01`, 31)) } }] },
      });
      if (covered) return { ok: false, error: covered.term === "LOCK12" ? "You already have a 12-month plan. Text Ryder to change it." : `You already have a plan for ${fmtMonth(month)}. Pick days in the next month to renew.` };
    }

    await quickSaveAccess({ propertyId: property.id, ...input.access });

    const draft = await getDraft(v.client.id);
    const existingPlan = await prisma.orderLine.findFirst({ where: { orderId: draft.id, kind: "PLAN", planTerm: { not: null } } });
    if (existingPlan) return { ok: false, error: "There is already a plan in your cart. Remove it first if you want a different one." };

    const rate = input.term === "LOCK12" && svc.lock12Price ? Number(svc.lock12Price) : Number(svc.price);
    const groupId = randomUUID();
    const details: LineDetails = { groupId, propertyId: property.id, answer: input.answer, planTerm: input.term, preferredWeekday, weekOrdinals: ordinals, month };

    await prisma.orderLine.create({
      data: {
        orderId: draft.id,
        serviceCode: svc.code,
        name: input.term === "LOCK12" ? `${svc.name} plan, 12-month locked rate` : `${svc.name} plan, ${fmtMonth(month)}`,
        kind: "PLAN",
        qty: 1,
        unitPrice: rate,
        // Month to month is bought one month at a time, so it is charged at checkout.
        // The 12-month plan bills through the Square subscription instead.
        amount: input.term === "MONTHLY" ? rate : 0,
        planTerm: input.term,
        details,
      },
    });
    for (const d of days) {
      await prisma.orderLine.create({
        data: {
          orderId: draft.id,
          serviceCode: svc.code,
          name: `${svc.name} visit`,
          kind: "PLAN",
          qty: 1,
          unitPrice: 0,
          amount: 0,
          scheduledDate: keyToVisitTime(d),
          details: { ...details, planVisit: true },
        },
      });
    }
    await prisma.order.update({ where: { id: draft.id }, data: { propertyId: property.id } });
    await recalc(draft.id);
    revalidatePath("/portal", "layout");
    return { ok: true, count: days.length + 1 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add that to your cart." };
  }
}

/** For the order popup: which dates a weekday pattern lands on, so the client sees them before adding. */
export async function previewPattern(input: { weekday: number; ordinals: number[]; month: string }): Promise<{ month: string; days: string[] }> {
  await viewerOrLogin();
  let month = /^\d{4}-\d{2}$/.test(input.month) ? input.month : currentMonthKey();
  let days = patternDays(await monthAvailability(month), input.weekday, input.ordinals);
  if (days.length === 0) {
    month = addMonths(month, 1);
    days = patternDays(await monthAvailability(month), input.weekday, input.ordinals);
  }
  return { month, days };
}

export async function addAddonToCart(input: {
  serviceCode: string;
  propertyId: string;
  days: string[];
  answer: string;
  serviceNotes?: ServiceNotes;
}): Promise<CartResult> {
  try {
    const v = await viewerOrLogin();
    const svc = await prisma.serviceCatalog.findUnique({ where: { code: input.serviceCode } });
    if (!svc || !svc.active || svc.kind === "PLAN") return { ok: false, error: "That service is not available right now." };
    const property = await ownedProperty(v.client.id, input.propertyId);
    if (svc.requiresPlan && !(await hasActivePlan(v.client.id))) return { ok: false, error: `${svc.name} is only available on a plan.` };

    const needsDate = svc.unit !== "EACH";
    const days = needsDate ? Array.from(new Set(input.days.filter(isDayKey))).sort() : [];
    if (needsDate && days.length === 0) return { ok: false, error: "Pick at least one day." };
    for (const d of days) await assertBookable(d);

    if (input.serviceNotes) await quickSaveAccess({ propertyId: property.id, serviceNotes: input.serviceNotes });

    const onPlan = svc.planPrice != null && (await hasActivePlan(v.client.id));
    const unit = svc.kind === "REQUEST" ? 0 : onPlan ? Number(svc.planPrice) : Number(svc.price);
    const groupId = randomUUID();
    const details: LineDetails = { groupId, propertyId: property.id, answer: input.answer };
    const draft = await getDraft(v.client.id);

    if (needsDate) {
      for (const d of days) {
        await prisma.orderLine.create({
          data: {
            orderId: draft.id,
            serviceCode: svc.code,
            name: svc.name,
            kind: svc.kind,
            qty: 1,
            unitPrice: unit,
            amount: unit,
            scheduledDate: keyToVisitTime(d),
            details,
          },
        });
      }
    } else {
      await prisma.orderLine.create({
        data: { orderId: draft.id, serviceCode: svc.code, name: svc.name, kind: svc.kind, qty: 1, unitPrice: unit, amount: unit, details },
      });
    }
    if (!draft.propertyId) await prisma.order.update({ where: { id: draft.id }, data: { propertyId: property.id } });
    await recalc(draft.id);
    revalidatePath("/portal", "layout");
    return { ok: true, count: Math.max(1, days.length) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add that to your cart." };
  }
}

export async function removeCartGroup(groupId: string): Promise<void> {
  const v = await viewerOrLogin();
  const draft = await prisma.order.findFirst({ where: { clientId: v.client.id, status: "DRAFT" } });
  if (!draft) return;
  const lines = await prisma.orderLine.findMany({ where: { orderId: draft.id } });
  const ids = lines.filter((l) => (l.details as LineDetails | null)?.groupId === groupId).map((l) => l.id);
  await prisma.orderLine.deleteMany({ where: { id: { in: ids } } });
  await recalc(draft.id);
  revalidatePath("/portal", "layout");
}

export async function clearCart(): Promise<void> {
  const v = await viewerOrLogin();
  await prisma.order.deleteMany({ where: { clientId: v.client.id, status: "DRAFT" } });
  revalidatePath("/portal", "layout");
}

/* -------------------------------------------------------- job creation */

function jobTitle(clientName: string, service: string, address: string) {
  return `${clientName} - ${service} - ${address}`;
}

async function buildJobNotes(propertyId: string | null, answer: string | undefined, label: string | null | undefined) {
  const parts: string[] = [];
  if (answer) parts.push(`${label ? label.replace(/\?$/, "") : "Client note"}: ${answer}`);
  if (propertyId) {
    const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { serviceNotes: true, keyLocation: true } });
    const sn = serviceNotesText(parseServiceNotes(p?.serviceNotes));
    if (sn) parts.push(sn);
    if (p?.keyLocation) parts.push(`Key: ${p.keyLocation}`);
  }
  return parts.join("\n") || null;
}

/* --------------------------------------------------------------- checkout */

export type CheckoutInput = {
  orderId: string;
  tipCents: number;
  agreementVersion: string;
  agreed: boolean;
  typedName: string;
  /** Square Web Payments SDK card token. Absent for REQUEST-only orders. */
  token?: string;
  verificationToken?: string;
};

export type CheckoutResult = { ok: true; orderId: string } | { ok: false; error: string };

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const v = await viewerOrLogin();
  const ip = await requestIp();
  const ua = await requestUserAgent();

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, clientId: v.client.id, status: "DRAFT" },
    include: { lines: true },
  });
  if (!order) return { ok: false, error: "Your cart is empty. Add something from the calendar first." };
  if (order.lines.length === 0) return { ok: false, error: "Your cart is empty." };

  const agreement = await prisma.agreementVersion.findFirst({ orderBy: { effectiveAt: "desc" } });
  if (!agreement) return { ok: false, error: "The service agreement is not set up yet. Text Ryder." };
  if (input.agreementVersion !== agreement.version || !input.agreed) return { ok: false, error: "Please read and agree to the service agreement." };
  const typedName = input.typedName.trim();
  if (typedName.length < 3) return { ok: false, error: "Type your full name to sign the agreement." };

  const tipCents = Math.max(0, Math.min(100_000, Math.round(input.tipCents || 0)));
  const chargeCents = order.lines.reduce((a, l) => a + cents(l.amount), 0) + tipCents;
  const planLine = order.lines.find((l) => l.kind === "PLAN" && l.planTerm);
  const scheduled = order.lines.filter((l) => l.scheduledDate);
  const requestOnly = !planLine && chargeCents === 0 && order.lines.every((l) => l.kind === "REQUEST");

  // Re-check every day right before we take money.
  try {
    for (const l of scheduled) await assertBookable(dayKey(l.scheduledDate as Date));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "One of your days is no longer open." };
  }
  if (planLine) {
    const d = (planLine.details ?? {}) as LineDetails;
    const live = await prisma.planSubscription.findMany({ where: { clientId: v.client.id, status: "ACTIVE" }, select: { term: true, endDate: true } });
    const clash = live.some((x) =>
      x.term === "LOCK12" || planLine.planTerm === "LOCK12"
        ? true
        : // A renewal is fine; the same month twice is not.
          Boolean(d.month && x.endDate && dayKey(x.endDate).slice(0, 7) >= d.month)
    );
    if (clash) return { ok: false, error: "You already have a plan covering that time. Remove the plan from your cart." };
  }

  // No Square yet (prototype / local): the order goes through as PENDING and
  // Ryder invoices it by hand. Nothing is lost, nothing is charged.
  const invoiceLater = (Boolean(planLine) || chargeCents > 0) && !square.squareConfigured();
  const needsCard = (Boolean(planLine) || chargeCents > 0) && !invoiceLater;
  if (needsCard && !input.token) return { ok: false, error: "Enter your card details to finish." };

  const svcCodes = Array.from(new Set(order.lines.map((l) => l.serviceCode)));
  const services = await prisma.serviceCatalog.findMany({ where: { code: { in: svcCodes } } });
  const svcByCode = new Map(services.map((x) => [x.code, x]));
  const property = order.propertyId ? await prisma.property.findUnique({ where: { id: order.propertyId } }) : null;
  const address = property?.address ?? "";

  // ---- Square ----
  let customerId: string | null = null;
  let cardId: string | null = null;
  let payment: square.SquarePayment | null = null;
  let subscription: square.SquareSubscription | null = null;
  let failure: string | null = null;

  if (needsCard) {
    try {
      const link = await prisma.squareLink.findFirst({ where: { clientId: v.client.id } });
      customerId = await square.ensureCustomer({
        existingId: v.client.status === "LEAD" ? null : (link?.squareCustomerId ?? null),
        name: v.client.name,
        email: v.user.email,
        phone: v.client.phone,
      });
      const card = await square.saveCard({ customerId, sourceId: input.token as string, cardholderName: typedName, verificationToken: input.verificationToken });
      cardId = card.id;

      if (chargeCents > 0) {
        const desc = order.lines.filter((l) => cents(l.amount) > 0).map((l) => l.name);
        // Square will not take a $0 payment that is all tip (12-month plan + tip), so
        // in that one case the tip becomes the payment amount.
        const tipOnly = chargeCents - tipCents === 0;
        payment = await square.createPayment({
          sourceId: cardId,
          customerId,
          amountCents: tipOnly ? tipCents : chargeCents - tipCents,
          tipCents: tipOnly ? 0 : tipCents,
          note: `CHM portal: ${tipOnly ? "tip" : Array.from(new Set(desc)).join(", ")}${address ? ` at ${address}` : ""}`.slice(0, 500),
          referenceId: order.id,
          idempotencyKey: `${order.id}:pay`,
        });
        if (payment.status !== "COMPLETED" && payment.status !== "APPROVED") {
          throw new Error("The payment did not complete. Please try again.");
        }
      }

      // Month to month is a one-month purchase charged above. Only the 12-month plan subscribes.
      if (planLine && planLine.planTerm === "LOCK12") {
        const svc = svcByCode.get(planLine.serviceCode)!;
        const term = "LOCK12" as const;
        const rate = Number(planLine.unitPrice);
        let variationId = svc.squareVariationLock12Id;
        if (!variationId) {
          const made = await square.ensurePlanVariation({
            planId: svc.squarePlanId,
            planName: `CHM ${svc.name} Plan`,
            variationName: term === "LOCK12" ? `12-month locked, $${rate}/mo` : `Month to month, $${rate}/mo`,
            monthlyCents: Math.round(rate * 100),
            periods: term === "LOCK12" ? 12 : null,
          });
          variationId = made.variationId;
          await prisma.serviceCatalog.update({
            where: { code: svc.code },
            data: {
              squarePlanId: made.planId,
              ...(term === "LOCK12" ? { squareVariationLock12Id: variationId } : { squareVariationMonthlyId: variationId }),
            },
          });
        }
        subscription = await square.createSubscription({
          customerId,
          cardId,
          planVariationId: variationId,
          startDate: todayKey(),
          idempotencyKey: `${order.id}:sub`,
        });
        // Read it back: a subscription that is not ACTIVE/PENDING never bills (the Eric Bohnert lesson).
        const check = await square.getSubscription(subscription.id);
        if (!["ACTIVE", "PENDING"].includes(check.status)) {
          throw new Error(`The monthly plan could not be started (status ${check.status}).`);
        }
        subscription = check;
      }
    } catch (e) {
      failure = square.friendlySquareMessage(e);
      // Undo a charge if the plan failed after the card was charged.
      if (payment && subscription == null && planLine && planLine.planTerm === "LOCK12") {
        try {
          await square.refundPayment({ paymentId: payment.id, amountCents: chargeCents, reason: "Plan setup failed, order rolled back", idempotencyKey: `${order.id}:rollback` });
        } catch (re) {
          console.error("[portal] rollback refund failed", re);
        }
      }
      await prisma.order.update({ where: { id: order.id }, data: { failureReason: failure } });
      return { ok: false, error: failure };
    }
  }

  // ---- Database: everything in one transaction ----
  const paidAt = new Date();
  const createdJobIds: string[] = [];
  await prisma.$transaction(async (tx) => {
    let subId: string | null = null;
    if (planLine) {
      const svc = svcByCode.get(planLine.serviceCode)!;
      const d = planLine.details as LineDetails;
      const term = planLine.planTerm as "MONTHLY" | "LOCK12";
      const start = term === "MONTHLY" && d.month ? keyToDate(`${d.month}-01`) : new Date();
      const end =
        term === "LOCK12"
          ? new Date(start.getFullYear() + 1, start.getMonth(), start.getDate())
          : keyToDate(`${d.month ?? currentMonthKey()}-${String(daysInMonth(d.month ?? currentMonthKey())).padStart(2, "0")}`);
      const sub = await tx.planSubscription.create({
        data: {
          clientId: v.client.id,
          propertyId: order.propertyId,
          serviceCode: svc.code,
          serviceName: svc.name,
          term,
          rate: planLine.unitPrice,
          visitsPerMonth: svc.visitsPerMonth ?? 1,
          preferredWeekday: d.preferredWeekday ?? null,
          weekOrdinals: d.weekOrdinals ?? [],
          startDate: start,
          endDate: end,
          status: "ACTIVE",
          squareSubscriptionId: subscription?.id ?? null,
          squareCustomerId: customerId,
          squareCardId: cardId,
        },
      });
      subId = sub.id;
      await tx.orderLine.update({ where: { id: planLine.id }, data: { subscriptionId: sub.id } });
      await tx.client.update({
        where: { id: v.client.id },
        data: {
          status: "ACTIVE",
          cadence: "MONTHLY",
          planName: svc.name,
          planAmount: planLine.unitPrice,
          visitsPerMonth: svc.visitsPerMonth ?? 1,
          lockedRate: term === "LOCK12",
          lockedUntil: term === "LOCK12" ? end : null,
          startDate: start,
          leadStage: "WON",
        },
      });
    } else if (chargeCents > 0) {
      const c = await tx.client.findUnique({ where: { id: v.client.id }, select: { status: true } });
      if (c && (c.status === "LEAD" || c.status === "FORMER")) {
        await tx.client.update({ where: { id: v.client.id }, data: { status: "ONE_TIME", leadStage: "WON" } });
      }
    }

    for (const l of scheduled) {
      const svc = svcByCode.get(l.serviceCode);
      const d = l.details as LineDetails;
      const isPlanVisit = Boolean(d.planVisit);
      const job = await tx.job.create({
        data: {
          clientId: v.client.id,
          propertyId: d.propertyId ?? order.propertyId,
          title: jobTitle(v.client.name, isPlanVisit ? `${svc?.name ?? "Home watch"} visit` : l.name, address),
          jobType: svc?.jobType ?? null,
          date: l.scheduledDate as Date,
          durationMin: 60,
          location: address || null,
          status: "SCHEDULED",
          source: "PORTAL",
          subscriptionId: isPlanVisit ? subId : null,
          chargeAmount: l.kind === "REQUEST" ? null : isPlanVisit ? null : l.amount,
          notes: [l.kind === "REQUEST" ? "QUOTE NEEDED: client requested this from the portal, nothing charged yet." : null, await buildJobNotes(d.propertyId ?? order.propertyId, d.answer, svc?.questionLabel)]
            .filter(Boolean)
            .join("\n"),
        },
      });
      createdJobIds.push(job.id);
      await tx.orderLine.update({ where: { id: l.id }, data: { jobId: job.id, subscriptionId: isPlanVisit ? subId : null } });
    }

    if (payment) {
      await tx.payment.create({
        data: {
          clientId: v.client.id,
          amount: chargeCents / 100,
          status: "PAID",
          paidDate: paidAt,
          method: "SQUARE",
          category: "A_LA_CARTE",
          description: `Portal order: ${Array.from(new Set(order.lines.filter((l) => cents(l.amount) > 0).map((l) => l.name))).join(", ")}${tipCents ? ` (includes $${(tipCents / 100).toFixed(2)} tip)` : ""}`,
          squarePaymentId: payment.id,
          orderId: order.id,
        },
      });
    }

    if (customerId) {
      await tx.squareLink.upsert({
        where: { squareCustomerId: customerId },
        create: { squareCustomerId: customerId, clientId: v.client.id },
        update: { clientId: v.client.id },
      });
      await tx.client.update({ where: { id: v.client.id }, data: { squareCustomerId: customerId } });
    }

    await tx.agreementAcceptance.create({
      data: { clientId: v.client.id, version: agreement.version, orderId: order.id, ip, typedName, userAgent: ua },
    });

    const requestLines = order.lines.filter((l) => l.kind === "REQUEST");
    for (const l of requestLines) {
      const d = l.details as LineDetails;
      await tx.task.create({
        data: {
          title: `Quote ${l.name} for ${v.client.name}${l.scheduledDate ? ` (${fmtShort(l.scheduledDate)})` : ""}`,
          priority: "HIGH",
          clientId: v.client.id,
          jobId: l.jobId,
          dueDate: new Date(Date.now() + 86_400_000),
          notes: d.answer || null,
        },
      });
    }

    if (invoiceLater) {
      await tx.task.create({
        data: {
          title: `Invoice ${v.client.name}: $${(chargeCents / 100).toFixed(2)}${planLine ? ` + ${planLine.name} at $${Number(planLine.unitPrice).toFixed(0)}/mo` : ""} (portal order, card payments not on yet)`,
          priority: "HIGH",
          clientId: v.client.id,
          dueDate: new Date(),
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: requestOnly || invoiceLater ? "PENDING" : "PAID",
        tip: tipCents / 100,
        total: chargeCents / 100,
        squarePaymentId: payment?.id ?? null,
        squareReceiptUrl: payment?.receipt_url ?? null,
        agreementVersion: agreement.version,
        agreementAcceptedAt: paidAt,
        acceptedIp: ip,
        acceptedName: typedName,
        paidAt: payment || planLine ? paidAt : null,
        failureReason: null,
      },
    });

  });

  // ---- After the money is safe: calendar, emails ----
  await pushJobsToCalendar(createdJobIds);
  await sendOrderEmails({ orderId: order.id, clientName: v.client.name, email: v.user.email, requestOnly, invoiceLater });

  revalidatePath("/portal", "layout");
  return { ok: true, orderId: order.id };
}

async function sendOrderEmails(p: { orderId: string; clientName: string; email: string; requestOnly: boolean; invoiceLater?: boolean }) {
  const o = await prisma.order.findUnique({ where: { id: p.orderId }, include: { lines: { orderBy: { scheduledDate: "asc" } }, property: true } });
  if (!o) return;
  const first = p.clientName.split(" ")[0];
  const plan = o.lines.find((l) => l.kind === "PLAN" && l.planTerm);
  const dated = o.lines.filter((l) => l.scheduledDate);
  const rows: Array<[string, string]> = [];
  if (plan) rows.push(["Plan", plan.planTerm === "LOCK12" ? `${plan.name}, $${Number(plan.unitPrice).toFixed(0)} a month, bills automatically for 12 months` : `${plan.name}, $${Number(plan.unitPrice).toFixed(0)} for the month. We will remind you to renew before it ends.`]);
  for (const l of dated) rows.push([fmtLong(l.scheduledDate as Date), `${l.name}${Number(l.amount) > 0 ? ` ($${Number(l.amount).toFixed(0)})` : ""}`]);
  for (const l of o.lines.filter((x) => !x.scheduledDate && !(x.kind === "PLAN" && x.planTerm))) rows.push([l.name, `$${Number(l.amount).toFixed(0)}`]);
  if (Number(o.tip) > 0) rows.push(["Tip", `$${Number(o.tip).toFixed(2)}, thank you`]);
  if (Number(o.total) > 0) rows.push([p.invoiceLater ? "To be invoiced" : "Charged today", `$${Number(o.total).toFixed(2)}`]);

  const blocks: MailBlock[] = [
    { p: p.requestOnly ? "We got your request. Ryder will look at it and text you a price before anything is charged." : p.invoiceLater ? "Your booking is in. Ryder will send the invoice by email, and your visits are on the calendar." : "Your booking is confirmed. Here is what we have." },
    { rows },
    { p: o.property ? `Home: ${o.property.address}` : "" },
    { p: "You can move or cancel any visit up to 3 days before its date from your calendar. Inside 3 days, text Ryder." },
    { button: { label: "Open your calendar", href: `${appUrl()}/portal` } },
  ].filter((b) => !("p" in b) || b.p);

  await sendPortalEmail({
    to: p.email,
    subject: p.requestOnly ? "We got your request" : "Your Coastal Home Management booking is confirmed",
    heading: `${first}, you are all set`,
    blocks,
  });

  await notifyRyder(
    `${p.requestOnly ? "Quote request" : "New order"} from ${p.clientName}${Number(o.total) > 0 ? ` ($${Number(o.total).toFixed(2)})` : ""}`,
    `${p.clientName} ${p.requestOnly ? "requested a quote" : "just booked"}`,
    [{ rows: [["Client", p.clientName], ["Email", p.email], ...rows] }, { button: { label: "Open CHM Ops", href: process.env.DASHBOARD_URL || "https://chm-dashboard.vercel.app" } }]
  );
}

/* ---------------------------------------------------- visits: move, cancel */

async function ownedPortalJob(clientId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, clientId },
    include: { orderLine: { include: { order: true } }, subscription: true },
  });
  if (!job) throw new Error("That visit is not on your account.");
  if (job.source !== "PORTAL") throw new Error("That visit was set up by Coastal Home Management. Text Ryder to change it.");
  if (job.status !== "SCHEDULED") throw new Error("That visit is already done or canceled.");
  const key = dayKey(job.date);
  if (!isEditableKey(key)) throw new Error(`That visit is inside the 3-day window. Text Ryder at (309) 415-8793 to change it.`);
  return job;
}

export async function moveVisit(jobId: string, newDay: string): Promise<CartResult> {
  try {
    const v = await viewerOrLogin();
    if (!isDayKey(newDay)) return { ok: false, error: "Pick a day." };
    const job = await ownedPortalJob(v.client.id, jobId);
    await assertBookable(newDay);
    const newDate = keyToVisitTime(newDay, 9);
    await prisma.job.update({ where: { id: job.id }, data: { date: newDate, endDate: null } });
    if (job.orderLine) await prisma.orderLine.update({ where: { id: job.orderLine.id }, data: { scheduledDate: newDate } });
    await pushJobsToCalendar([job.id]);
    revalidatePath("/portal", "layout");
    return { ok: true, count: 1 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not move that visit." };
  }
}

export async function cancelVisit(jobId: string): Promise<CartResult> {
  try {
    const v = await viewerOrLogin();
    const job = await ownedPortalJob(v.client.id, jobId);
    const line = job.orderLine;
    let refunded = 0;

    // A paid one-time service, 3+ days out: full refund to the card.
    if (line && line.kind === "ADDON" && Number(line.amount) > 0 && line.order.status === "PAID" && line.order.squarePaymentId) {
      const amountCents = cents(line.amount);
      try {
        await square.refundPayment({
          paymentId: line.order.squarePaymentId,
          amountCents,
          reason: `Canceled ${line.name} on ${fmtShort(job.date)}`,
          idempotencyKey: `refund:${line.id}`,
        });
        refunded = amountCents;
        const pay = await prisma.payment.findFirst({ where: { squarePaymentId: line.order.squarePaymentId } });
        if (pay) {
          await prisma.payment.update({
            where: { id: pay.id },
            data: { amount: Math.max(0, Number(pay.amount) - amountCents / 100), description: `${pay.description ?? "Portal order"} (refunded $${(amountCents / 100).toFixed(2)} for a canceled ${line.name})` },
          });
        }
      } catch (e) {
        console.error("[portal] refund failed", e);
        await notifyRyder(`Refund needed: ${v.client.name}`, `Refund $${(amountCents / 100).toFixed(2)} to ${v.client.name} by hand`, [
          { p: `${line.name} on ${fmtShort(job.date)} was canceled from the portal but the automatic refund failed. Refund it in Square.` },
        ]);
      }
    }

    await prisma.job.update({ where: { id: job.id }, data: { status: "CANCELED", notes: `${job.notes ? job.notes + "\n" : ""}Canceled by the client from the portal on ${fmtShort(new Date())}.` } });
    await pushJobsToCalendar([job.id]);
    await notifyRyder(`Visit canceled: ${v.client.name}`, `${v.client.name} canceled a visit`, [
      { rows: [["Visit", line?.name ?? job.title], ["Was", fmtLong(job.date)], ["Refunded", refunded ? `$${(refunded / 100).toFixed(2)}` : "nothing to refund"]] },
    ]);
    revalidatePath("/portal", "layout");
    return { ok: true, count: 1 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not cancel that visit." };
  }
}

/** Use one of this month's plan visits on a chosen open day (after a cancel, or when no weekday is set). */
export async function addPlanVisit(subscriptionId: string, day: string): Promise<CartResult> {
  try {
    const v = await viewerOrLogin();
    if (!isDayKey(day)) return { ok: false, error: "Pick a day." };
    const sub = await prisma.planSubscription.findFirst({ where: { id: subscriptionId, clientId: v.client.id, status: "ACTIVE" }, include: { property: true } });
    if (!sub) return { ok: false, error: "That plan is not active." };
    await assertBookable(day);
    const allowance = await planAllowance(sub.id, day.slice(0, 7));
    if (allowance.left <= 0) return { ok: false, error: `All ${allowance.allowed} of your plan visits for that month are already booked.` };
    const svc = await prisma.serviceCatalog.findUnique({ where: { code: sub.serviceCode } });
    const address = sub.property?.address ?? "";
    const job = await prisma.job.create({
      data: {
        clientId: v.client.id,
        propertyId: sub.propertyId,
        title: jobTitle(v.client.name, `${sub.serviceName} visit`, address),
        jobType: svc?.jobType ?? "Home watch visit",
        date: keyToVisitTime(day),
        durationMin: 60,
        location: address || null,
        status: "SCHEDULED",
        source: "PORTAL",
        subscriptionId: sub.id,
        notes: await buildJobNotes(sub.propertyId, undefined, null),
      },
    });
    await pushJobsToCalendar([job.id]);
    revalidatePath("/portal", "layout");
    return { ok: true, count: 1 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not book that visit." };
  }
}

/* -------------------------------------------------------------- the plan */

export async function setPreferredWeekday(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const v = await viewerOrLogin();
  const id = s(fd, "subscriptionId");
  const raw = s(fd, "weekday");
  const weekday = raw === "" ? null : Number(raw);
  if (weekday != null && !(weekday >= 0 && weekday <= 6)) return { error: "Pick a day of the week." };
  const rawOrd = s(fd, "ordinals");
  const weekOrdinals = rawOrd === "" ? [] : rawOrd.split(",").map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
  const sub = await prisma.planSubscription.findFirst({ where: { id, clientId: v.client.id } });
  if (!sub) return { error: "That plan is not on your account." };
  await prisma.planSubscription.update({ where: { id }, data: { preferredWeekday: weekday, weekOrdinals: sub.visitsPerMonth >= 4 ? [] : weekOrdinals } });
  revalidatePath("/portal", "layout");
  return {
    ok: true,
    message: weekday == null ? "Saved. Ryder will spread your visits across the month." : `Saved. We will put your visits on ${patternLabel(weekday, sub.visitsPerMonth >= 4 ? [] : weekOrdinals)}.`,
  };
}

export async function cancelPlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const v = await viewerOrLogin();
  const id = s(fd, "subscriptionId");
  const sub = await prisma.planSubscription.findFirst({ where: { id, clientId: v.client.id, status: { in: ["ACTIVE", "PAUSED"] } } });
  if (!sub) return { error: "That plan is not active." };

  if (sub.term === "MONTHLY") {
    // One month was bought and paid. Nothing recurs, so "cancel" just means the
    // client will not renew. Future visits in the paid month stay unless they cancel them.
    await prisma.planSubscription.update({ where: { id }, data: { status: "CANCELED", canceledAt: new Date(), cancelReason: "Client will not renew (portal)" } });
    await notifyRyder(`Not renewing: ${v.client.name}`, `${v.client.name} will not renew their ${sub.serviceName} plan`, [{ p: "Their paid month still runs. No reminder will go out." }]);
    revalidatePath("/portal", "layout");
    return { ok: true, message: "Got it. Your paid month still runs and we will not send a renewal reminder. Renew any time from your calendar." };
  }

  // 12-month lock: the $150 early cancellation fee from the agreement is charged
  // to the card on file, then the Square subscription stops.
  const FEE_CENTS = 15_000;
  let feeNote = "";
  if (square.squareConfigured() && sub.squareCardId && sub.squareCustomerId) {
    try {
      const pay = await square.createPayment({
        sourceId: sub.squareCardId,
        customerId: sub.squareCustomerId,
        amountCents: FEE_CENTS,
        note: `CHM portal: early cancellation fee, ${sub.serviceName} 12-month plan`,
        referenceId: `cancel-${sub.id}`.slice(0, 40),
        idempotencyKey: `cancelfee:${sub.id}`,
      });
      await prisma.payment.create({
        data: {
          clientId: v.client.id,
          amount: FEE_CENTS / 100,
          status: "PAID",
          paidDate: new Date(),
          method: "SQUARE",
          category: "OTHER",
          description: `Early cancellation fee, ${sub.serviceName} 12-month plan`,
          squarePaymentId: pay.id,
        },
      });
      feeNote = "The $150 cancellation fee was charged to your card on file.";
    } catch (e) {
      const why = square.friendlySquareMessage(e);
      return { error: `We could not charge the $150 cancellation fee to your card (${why}). Update your card, or text Ryder to sort it out. Your plan is unchanged.` };
    }
    if (sub.squareSubscriptionId) {
      try {
        await square.cancelSubscription(sub.squareSubscriptionId);
      } catch (e) {
        console.error("[portal] cancel subscription failed", e);
        await prisma.task.create({ data: { title: `Stop ${v.client.name}'s Square subscription by hand (portal cancel, fee already charged)`, priority: "HIGH", clientId: v.client.id, dueDate: new Date() } });
      }
    }
  } else {
    feeNote = "Ryder will send the $150 cancellation fee invoice.";
    await prisma.task.create({
      data: { title: `Invoice ${v.client.name} the $150 early cancellation fee and stop their ${sub.serviceName} billing (portal cancel, no card on file)`, priority: "HIGH", clientId: v.client.id, dueDate: new Date() },
    });
  }

  await prisma.planSubscription.update({ where: { id }, data: { status: "CANCELED", canceledAt: new Date(), cancelReason: "Client canceled early from the portal" } });
  await prisma.job.updateMany({
    where: { subscriptionId: id, status: "SCHEDULED", date: { gt: new Date(Date.now() + 3 * 86_400_000) } },
    data: { status: "CANCELED" },
  });
  await prisma.client.update({ where: { id: v.client.id }, data: { lockedRate: false, lockedUntil: null } }).catch(() => undefined);
  await notifyRyder(`Plan canceled early: ${v.client.name}`, `${v.client.name} ended their 12-month ${sub.serviceName} plan`, [{ p: feeNote }, { p: "Future plan visits more than 3 days out were removed from the calendar." }]);
  revalidatePath("/portal", "layout");
  return { ok: true, message: `Your plan is canceled. ${feeNote} Visits inside the next 3 days still happen. Thank you for having us.` };
}

/** Availability for another month, for the day picker inside the order popup. */
export async function fetchMonthDays(month: string): Promise<Array<{ key: string; open: boolean; bookable: boolean; editable: boolean; past: boolean; today: boolean; full: boolean }>> {
  await viewerOrLogin();
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const min = currentMonthKey();
  const max = addMonths(min, 3);
  if (month < min || month > max) return [];
  const avail = await monthAvailability(month);
  return Array.from(avail.values()).map((d) => ({ key: d.key, open: d.open, bookable: d.bookable, editable: d.editable, past: d.past, today: d.today, full: d.booked >= d.capacity }));
}
