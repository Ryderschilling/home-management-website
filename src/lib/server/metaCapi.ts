import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * Meta Conversions API, server side (added 9/28/26).
 *
 * The browser pixel misses a big share of events (iOS, ad blockers, in-app
 * browsers). This sends the same event from our server with a hashed email so
 * Meta can still match it to the person who saw the ad. The browser and the
 * server send the SAME event_id, so Meta counts it once.
 *
 * Env (Vercel, website project):
 *   NEXT_PUBLIC_META_PIXEL_ID  the "CHM Website" dataset id (already set)
 *   META_CAPI_TOKEN            Events Manager > CHM Website > Settings >
 *                              Conversions API > Generate access token
 * Missing either one = silently does nothing.
 */
const VERSION = process.env.META_API_VERSION || "v23.0";

const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
const phoneDigits = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `1${d}` : d;
};

export async function sendCapiEvent(opts: {
  eventName: "Lead" | "Schedule" | "SubmitApplication" | "Contact";
  eventId?: string | null;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
}): Promise<void> {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token || !/^\d+$/.test(pixel)) return;

  try {
    const jar = await cookies();
    const h = await headers();
    const ref = h.get("referer") || "https://coastalhomemngt30a.com/away-on-30a";

    // _fbc is Meta's click id cookie. If the pixel has not written it yet,
    // rebuild it from the fbclid our own tracker saved on first touch.
    let fbc = jar.get("_fbc")?.value;
    if (!fbc) {
      try {
        const a = JSON.parse(decodeURIComponent(jar.get("chm_attr")?.value || "{}")) as { ft?: { fbclid?: string; at?: string } };
        if (a.ft?.fbclid) fbc = `fb.1.${Date.parse(a.ft.at || "") || Date.now()}.${a.ft.fbclid}`;
      } catch {}
    }

    const user_data: Record<string, unknown> = {
      client_ip_address: (h.get("x-forwarded-for") || "").split(",")[0].trim() || undefined,
      client_user_agent: h.get("user-agent") || undefined,
      fbp: jar.get("_fbp")?.value,
      fbc,
    };
    if (opts.email) user_data.em = [sha(opts.email)];
    if (opts.phone) user_data.ph = [sha(phoneDigits(opts.phone))];
    if (opts.firstName) user_data.fn = [sha(opts.firstName)];

    const body = {
      data: [
        {
          event_name: opts.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: opts.eventId || undefined,
          action_source: "website",
          event_source_url: ref,
          user_data,
        },
      ],
      ...(process.env.META_CAPI_TEST_CODE ? { test_event_code: process.env.META_CAPI_TEST_CODE } : {}),
    };
    const res = await fetch(`https://graph.facebook.com/${VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error("[capi] rejected", res.status, (await res.text()).slice(0, 300));
  } catch (err) {
    console.error("[capi] failed", err instanceof Error ? err.message : err);
  }
}
