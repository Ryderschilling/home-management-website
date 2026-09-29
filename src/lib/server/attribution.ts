import { cookies, headers } from "next/headers";

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

export async function readAttribution(): Promise<{ attribution: Attribution | null; path: string | null }> {
  let path: string | null = null;
  try {
    const ref = (await headers()).get("referer");
    if (ref) path = new URL(ref).pathname;
  } catch {}
  try {
    const a = parseAttrCookie((await cookies()).get("chm_attr")?.value);
    if (!a) return { attribution: null, path };
    const t = creditedTouch(a);
    return {
      path,
      attribution: {
        visitorId: a.v,
        utmSource: t.utmSource, utmMedium: t.utmMedium, utmCampaign: t.utmCampaign, utmContent: t.utmContent, utmTerm: t.utmTerm,
        fbclid: t.fbclid, gclid: t.gclid,
        // An ad id on the latest touch beats none at all on the credited one.
        metaAdId: metaAdIdOf(t) || metaAdIdOf(a.lt),
        landingPage: t.landingPage, referrer: t.referrer, firstTouchAt: t.at,
      },
    };
  } catch {
    return { attribution: null, path };
  }
}
