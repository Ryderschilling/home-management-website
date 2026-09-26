import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { readPropertySecrets } from "@/lib/secrets";
import { parseServiceNotes } from "@/lib/portal/serviceNotes";
import { monthAvailability, planAllowance, getAvailabilityTemplate } from "@/lib/portal/rules";
import { currentMonthKey, addMonths, dayKey, earliestBookableKey, fmtShort, daysAgo, monthKeyOf } from "@/lib/portal/dates";
import PortalCalendar, { type CalendarData } from "@/components/portal/PortalCalendar";
import type { LineDetails } from "@/app/portal/actions/orders";

export const dynamic = "force-dynamic";

export default async function PortalHome({ searchParams }: { searchParams: Promise<{ m?: string; added?: string; renew?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const sp = await searchParams;

  const thisMonth = currentMonthKey();
  const maxMonth = addMonths(thisMonth, 3);
  const month = sp.m && /^\d{4}-\d{2}$/.test(sp.m) && sp.m >= thisMonth && sp.m <= maxMonth ? sp.m : thisMonth;
  const clientId = viewer.client.id;

  const [catalog, subs, properties, avail, jobs, draft, client, tpl, recentMonthly] = await Promise.all([
    prisma.serviceCatalog.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.planSubscription.findMany({ where: { clientId, status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
    prisma.property.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } }),
    monthAvailability(month),
    prisma.job.findMany({
      where: { clientId, date: { gte: daysAgo(45) } },
      orderBy: { date: "asc" },
      select: { id: true, title: true, jobType: true, date: true, status: true, source: true, subscriptionId: true, subscription: { select: { serviceName: true } }, orderLine: { select: { name: true, kind: true, amount: true } }, visitReport: { select: { id: true, status: true } } },
    }),
    prisma.order.findFirst({ where: { clientId, status: "DRAFT" }, include: { lines: true } }),
    prisma.client.findUnique({ where: { id: clientId }, select: { planName: true, planAmount: true, cadence: true, status: true, lockedUntil: true } }),
    getAvailabilityTemplate(),
    // The most recent month-to-month plan, active or recently ended, for the renew prompt.
    prisma.planSubscription.findFirst({
      where: { clientId, term: "MONTHLY", endDate: { gte: daysAgo(45) } },
      orderBy: { endDate: "desc" },
      select: { serviceCode: true, serviceName: true, endDate: true, status: true },
    }),
  ]);

  // Renew prompt: a MONTHLY plan that ends this month (or ended recently) and
  // nothing already covers next month.
  const nextMonth = addMonths(thisMonth, 1);
  const coveredNext = subs.some((s) => s.term === "LOCK12" || (s.endDate && monthKeyOf(dayKey(s.endDate)) >= nextMonth));
  const endMonth = recentMonthly?.endDate ? monthKeyOf(dayKey(recentMonthly.endDate)) : null;
  const coveredThis = subs.some((s) => s.term === "MONTHLY" && s.endDate && monthKeyOf(dayKey(s.endDate)) >= thisMonth);
  const renew =
    recentMonthly && endMonth && !coveredNext && endMonth <= thisMonth
      ? {
          serviceCode: recentMonthly.serviceCode,
          serviceName: recentMonthly.serviceName,
          // Ended already and nothing covers this month: offer this month first.
          month: !coveredThis && endMonth < thisMonth ? thisMonth : nextMonth,
          ended: recentMonthly.status !== "ACTIVE" || endMonth < thisMonth,
        }
      : null;

  const subViews = await Promise.all(
    subs.map(async (sub) => {
      const a = await planAllowance(sub.id, month);
      return {
        id: sub.id,
        serviceCode: sub.serviceCode,
        serviceName: sub.serviceName,
        rate: Number(sub.rate),
        term: sub.term,
        visitsPerMonth: sub.visitsPerMonth,
        preferredWeekday: sub.preferredWeekday,
        propertyId: sub.propertyId,
        used: a.used,
        left: a.left,
        endDate: sub.endDate ? fmtShort(sub.endDate) : null,
      };
    })
  );

  const legacyPlan =
    subs.length === 0 && client && client.status === "ACTIVE" && client.cadence === "MONTHLY" && client.planAmount && Number(client.planAmount) > 0
      ? { name: client.planName ?? "Home watch plan", rate: Number(client.planAmount), lockedUntil: client.lockedUntil ? fmtShort(client.lockedUntil) : null }
      : null;

  const onPlan = subs.length > 0 || Boolean(legacyPlan);

  // Cart groups for the summary strip.
  const groups = new Map<string, { groupId: string; name: string; days: string[]; amount: number; kind: string; term: string | null }>();
  for (const l of draft?.lines ?? []) {
    const d = (l.details ?? {}) as LineDetails;
    const g = groups.get(d.groupId) ?? { groupId: d.groupId, name: l.name, days: [], amount: 0, kind: l.kind, term: l.planTerm ?? null };
    if (l.kind === "PLAN" && l.planTerm) {
      g.name = l.name;
      g.term = l.planTerm;
    }
    if (l.scheduledDate) g.days.push(dayKey(l.scheduledDate));
    g.amount += Number(l.amount);
    groups.set(d.groupId, g);
  }

  const data: CalendarData = {
    month,
    minMonth: thisMonth,
    maxMonth,
    earliest: earliestBookableKey(),
    openWeekdays: tpl.weekdays,
    renew,
    clientName: viewer.client.name,
    onPlan,
    legacyPlan,
    subs: subViews,
    properties: properties.map((p) => {
      const r = readPropertySecrets(p);
      return {
        id: p.id,
        label: p.label,
        address: p.address,
        gateCode: r.gateCode ?? "",
        doorCode: r.doorCode ?? "",
        alarmCode: r.alarmCode ?? "",
        keyLocation: p.keyLocation ?? "",
        serviceNotes: parseServiceNotes(p.serviceNotes),
      };
    }),
    catalog: catalog.map((c) => ({
      code: c.code,
      name: c.name,
      blurb: c.blurb ?? "",
      kind: c.kind,
      unit: c.unit,
      price: Number(c.price),
      lock12Price: c.lock12Price != null ? Number(c.lock12Price) : null,
      planPrice: c.planPrice != null ? Number(c.planPrice) : null,
      visitsPerMonth: c.visitsPerMonth,
      requiresPlan: c.requiresPlan,
      questionLabel: c.questionLabel,
      questionHint: c.questionHint,
    })),
    days: Array.from(avail.values()).map((d) => ({ key: d.key, open: d.open, bookable: d.bookable, editable: d.editable, past: d.past, today: d.today, full: d.booked >= d.capacity })),
    jobs: jobs.map((j) => ({
      id: j.id,
      day: dayKey(j.date),
      name: j.orderLine?.name ?? (j.subscription ? `${j.subscription.serviceName} visit` : null) ?? j.jobType ?? j.title.replace(`${viewer.client.name} - `, "").split(" - ")[0],
      status: j.status,
      portal: j.source === "PORTAL",
      planVisit: Boolean(j.subscriptionId),
      paid: Number(j.orderLine?.amount ?? 0) > 0,
      reportId: j.visitReport?.status === "FINAL" ? j.visitReport.id : null,
    })),
    cart: { orderId: draft?.id ?? null, groups: Array.from(groups.values()), total: Number(draft?.subtotal ?? 0) },
    justAdded: sp.added === "1",
  };

  return <PortalCalendar data={data} openRenew={sp.renew === "1"} />;
}
