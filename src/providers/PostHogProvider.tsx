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
    let url = window.location.origin + pathname;
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,  // we handle it manually above for SPA routing
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: true,        // auto-tracks clicks, inputs, form submits
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: { password: true },
      },
    });
  }, []);

  if (!POSTHOG_KEY) {
    // PostHog not configured — pass through silently
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
