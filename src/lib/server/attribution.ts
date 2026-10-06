import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Read the `chm_attr` cookie that src/components/AdTracker.tsx keeps, and turn
 * it into the attribution block CHM Ops intake expects.
 *
 * First touch wins, with one exception (9/29/26 audit): a PAID click beats an
 * unpaid first touch. Someone who looked at the site once, then clicked a Meta
 * ad and opted in, is a Meta lead. Before this they were filed as "Direct".
 */
export type Attribution = {
  visitorId?: string;
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string;
  fbclid?: string; gclid?: string; metaAdId?: string; landingPage?: string; referrer?: string;
  firstTouchAt?: string;
};

type Touch = Record<string, string | undefined>;

const META_SRC = /^(meta|facebook|fb|instagram|ig|an|msg)$/i;
const ORGANIC_MED = /organic|group|post|social$/i;

/** Did an ad (Meta or Google) bring this touch? */
export function isPaidTouch(t: Touch | undefined | null): boolean {
  if (!t) return false;
  if (t.metaAdId || t.gclid) return true;
  const src = (t.utmSource || "").trim();
  const med = (t.utmMedium || "").trim();
  if (/cpc|ppc|paid|ads/i.test(med)) return true;
  if (META_SRC.test(src) && !ORGANIC_MED.test(med)) return true;
  return false;
}

/** The Meta ad id: an explicit ad_id / aid param, or a numeric utm_content on a Meta touch. */
export function metaAdIdOf(t: Touch | undefined | null): string | undefined {
  if (!t) return undefined;
  if (t.metaAdId && /^\d+$/.test(t.metaAdId)) return t.metaAdId;
  const c = (t.utmContent || "").trim();
  if (META_SRC.test((t.utmSource || "").trim()) && /^\d{6,}$/.test(c)) return c;
  return undefined;
}

/** Parse the cookie value whether or not Next already URL-decoded it. */
export function parseAttrCookie(raw: string | undefined | null): { v?: string; ft?: Touch; lt?: Touch } | null {
  if (!raw) return null;
  for (const s of [raw, (() => { try { return decodeURIComponent(raw); } catch { return raw; } })()]) {
    try {
      return JSON.parse(s) as { v?: string; ft?: Touch; lt?: Touch };
    } catch {}
  }
  return null;
}

/** The touch that gets the credit: first touch, unless a later touch was paid and the first was not. */
export function creditedTouch(a: { ft?: Touch; lt?: Touch } | null): Touch {
  if (!a) return {};
  const ft = a.ft ?? a.lt ?? {};
  if (a.lt && isPaidTouch(a.lt) && !isPaidTouch(ft)) return a.lt;
  return ft;
}

function toAttribution(a: { v?: string; ft?: Touch; lt?: Touch }): Attribution {
  const t = creditedTouch(a);
  return {
    visitorId: a.v,
    utmSource: t.utmSource, utmMedium: t.utmMedium, utmCampaign: t.utmCampaign, utmContent: t.utmContent, utmTerm: t.utmTerm,
    fbclid: t.fbclid, gclid: t.gclid,
    // An ad id on the latest touch beats none at all on the credited one.
    metaAdId: metaAdIdOf(t) || metaAdIdOf(a.lt),
    landingPage: t.landingPage, referrer: t.referrer, firstTouchAt: t.at,
  };
}

export async function readAttribution(): Promise<{ attribution: Attribution | null; path: string | null }> {
  let path: string | null = null;
  try {
    const ref = (await headers()).get("referer");
    if (ref) path = new URL(ref).pathname;
  } catch {}
  try {
    const a = parseAttrCookie((await cookies()).get("chm_attr")?.value);
    if (!a) return { attribution: null, path };
    return { path, attribution: toAttribution(a) };
  } catch {
    return { attribution: null, path };
  }
}

/* ------------------------------------------------------------------------ *
 * resolveAttribution (10/6/26)
 *
 * The Facebook in-app browser dropped the chm_attr cookie between landing and
 * opt-in (Jon Reiter, 30A locals, R1 | Mailbox: landed 18s before opting in,
 * saved as "direct"). Three layers, in order:
 *   1. the cookie (readAttribution)
 *   2. the attribution the form sent in its POST body (AdTracker formAttr),
 *      used when the cookie is missing, or the cookie has no ad and the form does
 *   3. still no ad, and the browser came from Facebook / Instagram / Messenger
 *      or sent no referrer: a Meta ad page view on the same page in the last
 *      15 minutes with no lead tied to it yet. Used ONLY when exactly one
 *      visitor matches, so a guess never splits credit between two people.
 * ------------------------------------------------------------------------ */
export type ResolvedAttribution = {
  attribution: Attribution | null;
  path: string | null;
  matchedBy: "cookie" | "form" | "recent-ad-visit" | null;
};

const FB_REF = /(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|messenger\.com|m\.me)$/i;
const RECENT_MS = 15 * 60 * 1000;

function hasAd(a: Attribution | null | undefined): boolean {
  if (!a) return false;
  return !!a.metaAdId || !!a.gclid || isPaidTouch(a as Touch);
}

const str = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined);

function cleanTouch(t: unknown): Touch | undefined {
  if (!t || typeof t !== "object") return undefined;
  const o = t as Record<string, unknown>;
  return {
    utmSource: str(o.utmSource, 80), utmMedium: str(o.utmMedium, 80), utmCampaign: str(o.utmCampaign, 160),
    utmContent: str(o.utmContent, 160), utmTerm: str(o.utmTerm, 160), fbclid: str(o.fbclid, 300), gclid: str(o.gclid, 300),
    metaAdId: str(o.metaAdId, 40), landingPage: str(o.landingPage, 200), referrer: str(o.referrer, 300), at: str(o.at, 40),
  };
}

/** The form's attr from the POST body, checked and trimmed. Null when it is not usable. */
function parseBodyAttr(raw: unknown): { a: { v?: string; ft?: Touch; lt?: Touch } | null; referrer: string } {
  if (!raw || typeof raw !== "object") return { a: null, referrer: "" };
  const o = raw as Record<string, unknown>;
  const referrer = str(o.r, 300) ?? "";
  const v = str(o.v, 64);
  const ft = cleanTouch(o.ft);
  const lt = cleanTouch(o.lt);
  if (!v && !ft && !lt) return { a: null, referrer };
  return { a: { v: v && /^[A-Za-z0-9_-]+$/.test(v) ? v : undefined, ft, lt }, referrer };
}

function fromSocialOrNowhere(referrer: string): boolean {
  if (!referrer) return true;
  try {
    return FB_REF.test(new URL(referrer).hostname);
  } catch {
    return false;
  }
}

/** The page to match on: anything under /away-on-30a counts as /away-on-30a. */
function pageKey(path: string | null): string | null {
  if (!path) return null;
  if (path === "/away-on-30a" || path.startsWith("/away-on-30a/")) return "/away-on-30a";
  return path;
}

async function recentAdVisit(path: string | null, knownVisitor?: string): Promise<Attribution | null> {
  const page = pageKey(path);
  if (!page) return null;
  const since = new Date(Date.now() - RECENT_MS);
  // Guard: this browser has its own id and landed on the page with no ad in
  // the window, so it is a different person from any ad visitor. No guess.
  if (knownVisitor) {
    const own = await prisma.trackEvent.count({
      where: { visitorId: knownVisitor, type: "pageview", path: page, metaAdId: null, createdAt: { gte: since } },
    });
    if (own > 0) return null;
  }
  const rows = await prisma.trackEvent.findMany({
    where: {
      type: "pageview",
      metaAdId: { not: null },
      clientId: null,
      createdAt: { gte: since },
      ...(page === "/away-on-30a" ? { OR: [{ path: "/away-on-30a" }, { path: { startsWith: "/away-on-30a/" } }] } : { path: page }),
    },
    orderBy: { createdAt: "asc" },
    select: { visitorId: true, metaAdId: true, utmSource: true, utmCampaign: true, utmContent: true, createdAt: true },
    take: 50,
  });
  const visitors = new Set(rows.map((r) => r.visitorId));
  if (visitors.size !== 1) return null;
  const r = rows[0];
  return {
    visitorId: r.visitorId,
    metaAdId: r.metaAdId ?? undefined,
    utmSource: r.utmSource ?? undefined,
    utmMedium: "paid",
    utmCampaign: r.utmCampaign ?? undefined,
    utmContent: r.utmContent ?? undefined,
    landingPage: page,
    firstTouchAt: r.createdAt.toISOString(),
  };
}

export async function resolveAttribution(bodyAttr?: unknown): Promise<ResolvedAttribution> {
  const { attribution: cookie, path } = await readAttribution();
  let attribution: Attribution | null = cookie;
  let matchedBy: ResolvedAttribution["matchedBy"] = cookie ? "cookie" : null;

  const { a, referrer } = parseBodyAttr(bodyAttr);
  if (a) {
    try {
      const form = toAttribution(a);
      if (!cookie || (!hasAd(cookie) && hasAd(form))) {
        attribution = form;
        matchedBy = "form";
      }
    } catch {}
  }

  if (!hasAd(attribution) && fromSocialOrNowhere(referrer)) {
    try {
      const recent = await recentAdVisit(path, attribution?.visitorId);
      if (recent) {
        attribution = recent;
        matchedBy = "recent-ad-visit";
      }
    } catch (err) {
      console.error("[attribution] recent ad visit lookup failed:", err);
    }
  }
  return { attribution, path, matchedBy };
}
