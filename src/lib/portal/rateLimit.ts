/**
 * Small fixed-window rate limiter on a database row. No Redis.
 * hit("login:someone@x.com", 5, 15) allows 5 tries per 15 minutes.
 */
import { prisma } from "@/lib/prisma";

export async function hit(key: string, max: number, windowMinutes: number): Promise<{ ok: boolean; retryMinutes: number }> {
  const now = new Date();
  const row = await prisma.portalRateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt < now) {
    await prisma.portalRateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now.getTime() + windowMinutes * 60_000) },
      update: { count: 1, resetAt: new Date(now.getTime() + windowMinutes * 60_000) },
    });
    return { ok: true, retryMinutes: 0 };
  }
  if (row.count >= max) {
    return { ok: false, retryMinutes: Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 60_000)) };
  }
  await prisma.portalRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return { ok: true, retryMinutes: 0 };
}

export async function clear(key: string): Promise<void> {
  await prisma.portalRateLimit.deleteMany({ where: { key } });
}
