"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Tracks page views on route changes (Next.js App Router doesn't fire full reloads)
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    // Replays only on the ad funnel (added 2026-10-01). Everywhere else, and
    // above all on /portal where clients see their own addresses, nothing
    // is recorded. Heatmaps (click spots + scroll depth) run sitewide.
    if (pathname.startsWith("/away-on-30a")) {
      if (!ph.sessionRecordingStarted()) ph.startSessionRecording();
    } else if (ph.sessionRecordingStarted()) {
      ph.stopSessionRecording();
    }
    let url = window.location.origin + pathname;
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    // Ryder's own browser (?chm_internal=1, set by AdTracker) is never tracked.
    let internal = false;
    try { internal = localStorage.getItem("chm_internal") === "1"; } catch {}
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,  // we handle it manually above for SPA routing
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: true,        // auto-tracks clicks, inputs, form submits
      // Click and scroll heatmaps, read by the Ads page in CHM Ops.
      enable_heatmaps: true,
      // Recording starts only on the ad funnel, see PostHogPageView.
      disable_session_recording: true,
      session_recording: {
        // Recordings show where people tap and stall, never what they type.
        maskAllInputs: true,
      },
    });
    if (internal) posthog.opt_out_capturing();
  }, []);

  if (!POSTHOG_KEY) {
    // PostHog not configured, pass through silently
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
