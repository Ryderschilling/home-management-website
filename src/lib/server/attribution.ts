import { cookies, headers } from "next/headers";

/**
 * Read the `chm_attr` cookie that src/components/AdTracker.tsx keeps, and turn
 * it into the attribution block CHM Ops intake expects. First touch wins, so a
 * lead is credited to whatever FIRST brought them, which is how /ads counts.
 */
export type Attribution = {
  visitorId?: string;
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string;
  fbclid?: string; gclid?: string; metaAdId?: string; landingPage?: string; referrer?: string;
  firstTouchAt?: string;
};

export async function readAttribution(): Promise<{ attribution: Attribution | null; path: string | null }> {
  let path: string | null = null;
  try {
    const ref = (await headers()).get("referer");
    if (ref) path = new URL(ref).pathname;
  } catch {}
  try {
    const raw = (await cookies()).get("chm_attr")?.value;
    if (!raw) return { attribution: null, path };
    const a = JSON.parse(decodeURIComponent(raw)) as { v?: string; ft?: Record<string, string>; lt?: Record<string, string> };
    const t = a.ft ?? a.lt ?? {};
    return {
      path,
      attribution: {
        visitorId: a.v,
        utmSource: t.utmSource, utmMedium: t.utmMedium, utmCampaign: t.utmCampaign, utmContent: t.utmContent, utmTerm: t.utmTerm,
        fbclid: t.fbclid, gclid: t.gclid,
        // An ad id on the latest touch beats none at all on the first.
        metaAdId: t.metaAdId || a.lt?.metaAdId,
        landingPage: t.landingPage, referrer: t.referrer, firstTouchAt: t.at,
      },
    };
  } catch {
    return { attribution: null, path };
  }
}
