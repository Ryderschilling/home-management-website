/**
 * Monthly auto-placement of plan visits. Runs from the Vercel cron on the 1st
 * (src/app/api/portal/cron/monthly) and can be called by hand.
 *
 * For every active plan with a preferred weekday: if the month has no visits
 * booked yet, place `visitsPerMonth` of them on that weekday, evenly spaced,
 * skipping closed or full days. Then email the client the dates.
 */
import { prisma } from "@/lib/prisma";
import { monthAvailability, planAllowance, spreadDays, patternDays, patternLabel } from "./rules";
import { dayKey, keyToDate, keyToVisitTime, fmtLong, fmtMonth, addMonths, currentMonthKey, daysInMonth } from "./dates";
import { parseServiceNotes, serviceNotesText } from "./serviceNotes";
import { pushJobsToCalendar } from "./dashboardBridge";
import { sendPortalEmail, appUrl } from "./email";

async function notesFor(propertyId: string | null): Promise<string | null> {
  if (!propertyId) return null;
  const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { serviceNotes: true, keyLocation: true } });
  const parts: string[] = [];
  const sn = serviceNotesText(parseServiceNotes(p?.serviceNotes));
  if (sn) parts.push(sn);
  if (p?.keyLocation) parts.push(`Key: ${p.keyLocation}`);
  return parts.join("\n") || null;
}

export async function placeMonthlyVisits(monthKey: string = addMonths(currentMonthKey(), 1)): Promise<{ placed: number; jobIds: string[]; clients: string[] }> {
  // Only the 12-month plans recur. Month to month is bought one month at a time.
  const subs = await prisma.planSubscription.findMany({
    where: { status: "ACTIVE", term: "LOCK12", preferredWeekday: { not: null } },
    include: { client: { select: { id: true, name: true, email: true } }, property: true },
  });
  const avail = await monthAvailability(monthKey);
  const jobIds: string[] = [];
  const clients: string[] = [];
  for (const sub of subs) {
    if (sub.endDate && dayKey(sub.endDate) < `${monthKey}-01`) continue;
    const allowance = await planAllowance(sub.id, monthKey);
    if (allowance.used > 0 || allowance.left <= 0) continue;
    const days = sub.weekOrdinals.length || sub.visitsPerMonth >= 4
      ? patternDays(avail, sub.preferredWeekday as number, sub.weekOrdinals).slice(0, allowance.left)
      : spreadDays(avail, allowance.left, sub.preferredWeekday);
    if (days.length === 0) continue;
    const svc = await prisma.serviceCatalog.findUnique({ where: { code: sub.serviceCode } });
    const address = sub.property?.address ?? "";
    const notes = await notesFor(sub.propertyId);
    for (const d of days) {
      const job = await prisma.job.create({
        data: {
          clientId: sub.clientId,
          propertyId: sub.propertyId,
          title: `${sub.client.name} - ${sub.serviceName} visit - ${address}`,
          jobType: svc?.jobType ?? "Home watch visit",
          date: keyToVisitTime(d),
          durationMin: 60,
          location: address || null,
          status: "SCHEDULED",
          source: "PORTAL",
          subscriptionId: sub.id,
          notes,
        },
      });
      jobIds.push(job.id);
      const info = avail.get(d);
      if (info) info.booked += 1;
    }
    clients.push(sub.client.name);
    if (sub.client.email) {
      await sendPortalEmail({
        to: sub.client.email,
        subject: `Your ${sub.serviceName} visits for ${fmtMonth(monthKey)}`,
        heading: `${sub.client.name.split(" ")[0]}, here are your upcoming visits`,
        blocks: [
          { p: `We placed your ${sub.serviceName} visits on ${patternLabel(sub.preferredWeekday as number, sub.weekOrdinals)} as usual. Move any of them from your calendar up to 3 days before.` },
          { rows: days.map((d) => [fmtLong(d), `${sub.serviceName} visit`] as [string, string]) },
          { button: { label: "See your calendar", href: `${appUrl()}/portal?m=${monthKey}` } },
        ],
      });
    }
  }
  await pushJobsToCalendar(jobIds);
  return { placed: jobIds.length, jobIds, clients };
}

/**
 * Month-to-month renewals. Runs on the 24th: every active one-month plan that
 * ends this month and has no plan bought for next month gets one reminder.
 */
export async function sendRenewalReminders(): Promise<{ reminded: string[] }> {
  const month = currentMonthKey();
  const next = addMonths(month, 1);
  const nextStart = keyToDate(`${next}-01`);
  const subs = await prisma.planSubscription.findMany({
    where: { status: "ACTIVE", term: "MONTHLY", renewalReminderAt: null, endDate: { lt: new Date(nextStart.getTime() + 86_400_000) } },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  const reminded: string[] = [];
  for (const sub of subs) {
    const renewed = await prisma.planSubscription.findFirst({
      where: { clientId: sub.clientId, status: "ACTIVE", id: { not: sub.id }, startDate: { gte: nextStart } },
    });
    if (renewed || !sub.client.email) continue;
    await sendPortalEmail({
      to: sub.client.email,
      subject: `Keep your ${sub.serviceName} visits going in ${fmtMonth(next)}`,
      heading: `${sub.client.name.split(" ")[0]}, your plan ends ${fmtLong(`${month}-${String(daysInMonth(month)).padStart(2, "0")}`)}`,
      blocks: [
        { p: `Your ${sub.serviceName} plan covers ${fmtMonth(month)} only. To keep the visits coming in ${fmtMonth(next)}, renew from your calendar and pick your days. It takes about a minute.` },
        { button: { label: `Renew for ${fmtMonth(next)}`, href: `${appUrl()}/portal?m=${next}&renew=1` } },
        { p: "No renewal, no charge. Your home just will not be on the route next month." },
      ],
    });
    await prisma.planSubscription.update({ where: { id: sub.id }, data: { renewalReminderAt: new Date() } });
    reminded.push(sub.client.name);
  }
  return { reminded };
}

/**
 * On the 1st: close out month-to-month plans whose month has ended, with one
 * last nudge to renew for anyone who did not.
 */
export async function expireMonthlyPlans(): Promise<{ expired: string[] }> {
  const month = currentMonthKey();
  const start = keyToDate(`${month}-01`);
  const ended = await prisma.planSubscription.findMany({
    where: { status: "ACTIVE", term: "MONTHLY", endDate: { lt: start } },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  const expired: string[] = [];
  for (const sub of ended) {
    await prisma.planSubscription.update({ where: { id: sub.id }, data: { status: "CANCELED", canceledAt: new Date(), cancelReason: "Month ended, not renewed" } });
    const renewed = await prisma.planSubscription.findFirst({ where: { clientId: sub.clientId, status: "ACTIVE", startDate: { gte: start } } });
    if (!renewed) {
      await prisma.client.update({ where: { id: sub.clientId }, data: { status: "PAUSED" } }).catch(() => undefined);
      if (sub.client.email) {
        await sendPortalEmail({
          to: sub.client.email,
          subject: `Your ${sub.serviceName} plan has ended`,
          heading: `${sub.client.name.split(" ")[0]}, we are off your route this month`,
          blocks: [
            { p: `Your ${sub.serviceName} plan for last month has ended and was not renewed, so there are no visits booked for ${fmtMonth(month)}. Renew any time and pick your days.` },
            { button: { label: `Renew for ${fmtMonth(month)}`, href: `${appUrl()}/portal?renew=1` } },
          ],
        });
      }
    }
    expired.push(sub.client.name);
  }
  return { expired };
}
