/**
 * Conversion pings for the Away on 30A funnel. Every tool that is on the page
 * gets told, so Meta can optimize, GA4 can report and CHM Ops can count.
 * Silent no-ops for anything not loaded.
 */
type W = {
  gtag?: (c: string, a: string, p: Record<string, unknown>) => void;
  posthog?: { capture: (e: string, p?: Record<string, unknown>) => void };
  fbq?: (a: string, e: string, p?: Record<string, unknown>, o?: { eventID: string }) => void;
  pulse?: (e: string, p?: Record<string, unknown>) => void;
};

const GOOGLE_ADS_ID = "AW-18257719328";
const CONVERSION_LABEL = "JhfKCL2oyskcEKDg-oFE";

export type Step = "optin" | "walkthrough" | "start";

export function fireConversion(step: Step, eventId?: string) {
  try {
    const w = window as unknown as W;
    if (step === "optin") {
      // The opt-in is the Lead. It is what the Meta ad set optimizes for.
      w.fbq?.("track", "Lead", { content_name: "Away on 30A opt-in" }, eventId ? { eventID: eventId } : undefined);
      w.gtag?.("event", "generate_lead", { form_location: "/away-on-30a" });
      w.posthog?.capture("away_optin");
      w.pulse?.("form", { label: "Away on 30A opt-in" });
    } else if (step === "walkthrough") {
      w.fbq?.("track", "Schedule", { content_name: "Away on 30A walkthrough" });
      w.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}` });
      w.posthog?.capture("away_walkthrough_booked");
      w.pulse?.("form", { label: "Away on 30A walkthrough" });
    } else {
      w.fbq?.("track", "SubmitApplication", { content_name: "Away on 30A start now" });
      w.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}` });
      w.posthog?.capture("away_start_requested");
      w.pulse?.("form", { label: "Away on 30A start now" });
    }
  } catch {}
}

/** The email they opted in with, kept in this tab only so page 2 can prefill it. */
export const EMAIL_KEY = "chm_away_email";
export function rememberEmail(email: string) {
  try {
    sessionStorage.setItem(EMAIL_KEY, email);
  } catch {}
}
export function recallEmail(): string {
  try {
    return sessionStorage.getItem(EMAIL_KEY) || "";
  } catch {
    return "";
  }
}
