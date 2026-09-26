/**
 * Portal sessions. The cookie holds a random id; the row in PortalSession is
 * the truth. Deleting the row logs the browser out.
 */
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { opaqueToken } from "./password";

export const SESSION_COOKIE = "chm_portal";
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<void> {
  const id = opaqueToken(32);
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.portalSession.create({
    data: { id, userId, expiresAt, userAgent: h.get("user-agent")?.slice(0, 200) ?? null },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    await prisma.portalSession.deleteMany({ where: { id } }).catch(() => undefined);
  }
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.portalSession.deleteMany({ where: { userId } });
}

export type PortalViewer = {
  user: { id: string; email: string; emailVerifiedAt: Date | null };
  client: { id: string; name: string; email: string | null; phone: string | null; status: string; altContact: string | null };
};

/**
 * The logged-in viewer for this request, or null. Cached per request so the
 * layout and the page share one lookup.
 */
export const getViewer = cache(async (): Promise<PortalViewer | null> => {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const s = await prisma.portalSession.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          client: { select: { id: true, name: true, email: true, phone: true, status: true, altContact: true } },
        },
      },
    },
  });
  if (!s || s.expiresAt < new Date()) return null;
  return {
    user: { id: s.user.id, email: s.user.email, emailVerifiedAt: s.user.emailVerifiedAt },
    client: s.user.client,
  };
});

/** Best-effort client IP for the agreement acceptance record. */
export async function requestIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
}

export async function requestUserAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent")?.slice(0, 200) ?? null;
}
