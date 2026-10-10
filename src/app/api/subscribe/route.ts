import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSubscriberWelcome } from "@/lib/server/subscriber-welcome";

export const runtime = "nodejs";

/**
 * POST /api/subscribe  (added 10/10/26)
 *
 * Email list signup: storm alerts (storm pages) and homeowner news (footer,
 * every page). Writes the Subscriber table in the CHM Ops database, which the
 * dashboard shows on /list. Deliberately NOT a lead: no Client row, no lead
 * inbox, no follow-up sequence. One welcome email, sent once per address.
 *
 * Body: { email, firstName?, list: "storm" | "news", path?, attr?, company? }
 */

function clean(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Honeypot: a filled hidden field means a bot. Answer ok and drop it.
    if (clean(body.company)) return NextResponse.json({ ok: true });

    const email = clean(body.email, 160).toLowerCase();
    const firstName = clean(body.firstName, 80) || null;
    const storm = body.list === "storm";
    const path = clean(body.path, 200) || null;
    const attr = body.attr && typeof body.attr === "object" ? (body.attr as { v?: unknown }) : null;
    const visitorId = attr && typeof attr.v === "string" && attr.v.length <= 64 ? attr.v : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: { message: "Add a valid email address." } }, { status: 400 });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    const row = existing
      ? await prisma.subscriber.update({
          where: { email },
          data: {
            // Signing up again on purpose turns them back on.
            optedOutAt: null,
            storm: existing.storm || storm,
            news: existing.news || !storm,
            firstName: existing.firstName || firstName,
            visitorId: existing.visitorId || visitorId,
          },
        })
      : await prisma.subscriber.create({
          data: { email, firstName, storm, news: !storm, sourcePath: path, visitorId },
        });

    if (visitorId && path) {
      await prisma.trackEvent
        .create({ data: { visitorId, type: "subscribe", path, label: storm ? "storm" : "news" } })
        .catch(() => {});
    }

    if (!row.welcomeSentAt) {
      const sent = await sendSubscriberWelcome({ email, firstName: row.firstName, storm: row.storm, unsubToken: row.unsubToken });
      if (sent) await prisma.subscriber.update({ where: { id: row.id }, data: { welcomeSentAt: new Date() } }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe] failed:", err);
    return NextResponse.json({ ok: false, error: { message: "That did not go through. Try again in a minute." } }, { status: 500 });
  }
}
