"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  QR_MAIN_PRODUCT_NAME,
  QR_UPSELL_ADDON_COMPARE_AT_CENTS,
  QR_UPSELL_ADDON_KEY,
  QR_UPSELL_ADDON_NAME,
  QR_UPSELL_ADDON_PRICE_CENTS,
  formatUsd,
  getQrColorOption,
  safeString,
} from "@/lib/qr-funnel";

type CheckoutAction = "add" | "skip" | "";

function shouldTrackOnce(key: string) {
  if (typeof window === "undefined" || !key) return false;

  const storageKey = `chm-track:${key}`;

  if (window.sessionStorage.getItem(storageKey) === "1") {
    return false;
  }

  window.sessionStorage.setItem(storageKey, "1");
  return true;
}

async function trackCampaignEvent(
  eventType: string,
  campaignCode: string,
  sessionKey: string,
  pagePath: string,
  metadata?: Record<string, unknown>
) {
  if (!campaignCode) return;

  await fetch("/api/marketing/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      campaignCode,
      sessionKey,
      pagePath,
      metadata,
    }),
  }).catch(() => {});
}

function UpgradeImageCard({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/35 p-3">
      <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-white/55">
        {label}
      </div>
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04]">
        <img src={src} alt={alt} className="aspect-[4/3] w-full object-cover" />
      </div>
    </div>
  );
}

function QrUpgradePageInner() {
  const params = useSearchParams();
  const [action, setAction] = useState<CheckoutAction>("");
  const [error, setError] = useState("");

  const color = safeString(params.get("color")) || "beige";
  const campaignCode = safeString(params.get("campaignCode"));
  const sessionKey = safeString(params.get("sessionKey"));
  const landingPath = safeString(params.get("landingPath")) || "/qr";

  const selectedColor = useMemo(() => getQrColorOption(color), [color]);

  useEffect(() => {
    posthog.capture("qr_upgrade_viewed", {
      color: selectedColor.id,
      campaign_code: campaignCode || null,
    });

    if (!campaignCode || !shouldTrackOnce(`page_view:/qr/upgrade:${campaignCode}:${sessionKey}`)) {
      return;
    }

    void trackCampaignEvent("page_view", campaignCode, sessionKey, "/qr/upgrade", {
      color: selectedColor.id,
      sourceLandingPath: landingPath,
    });
  }, [campaignCode, landingPath, selectedColor.id, sessionKey]);

  async function continueToCheckout(addAddon: boolean) {
    setAction(addAddon ? "add" : "skip");
    setError("");

    if (addAddon) {
      posthog.capture("qr_addon_selected", {
        color: selectedColor.id,
        campaign_code: campaignCode || null,
        addon_product_key: QR_UPSELL_ADDON_KEY,
      });
    } else {
      posthog.capture("qr_addon_declined", {
        color: selectedColor.id,
        campaign_code: campaignCode || null,
      });
    }

    try {
      if (
        addAddon &&
        campaignCode &&
        shouldTrackOnce(`add_on_selected:${campaignCode}:${sessionKey}`)
      ) {
        await trackCampaignEvent(
          "add_on_selected",
          campaignCode,
          sessionKey,
          "/qr/upgrade",
          {
            addonSelected: true,
            addonProductKey: QR_UPSELL_ADDON_KEY,
            addonProductName: QR_UPSELL_ADDON_NAME,
            addonPriceCents: QR_UPSELL_ADDON_PRICE_CENTS,
            color: selectedColor.id,
          }
        );
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          color: selectedColor.id,
          tosAccepted: true,
          campaignCode,
          sessionKey,
          landingPath,
          addonSelected: addAddon,
          addonProductKey: addAddon ? QR_UPSELL_ADDON_KEY : null,
          addonProductName: addAddon ? QR_UPSELL_ADDON_NAME : null,
          addonPriceCents: addAddon ? QR_UPSELL_ADDON_PRICE_CENTS : null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Checkout failed");
      }

      window.location.href = json.data.url;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Checkout failed");
      setAction("");
    }
  }

  const busy = action !== "";

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5">
          <Link href="/qr" className="flex items-center gap-3">
            <Image
              src="/chm-logo.png"
              alt="Coastal Home Management"
              width={72}
              height={22}
              priority
            />
          </Link>

          <Link
            href="/qr"
            className="rounded-full border border-white/15 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/80 transition hover:bg-white/10"
          >
            Back
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
              One-click upgrade
            </div>

            <h1 className="mt-3 max-w-[16ch] text-3xl font-semibold tracking-tight sm:text-4xl">
              Upgrade your landscape with an electrical box cover
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-[15px]">
              Add a matching artificial rock cover to hide exposed electrical
              equipment, improve curb appeal, and keep the whole landscape looking
              intentional.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70">
                Main product: {QR_MAIN_PRODUCT_NAME}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70">
                Selected rock color: {selectedColor.label}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <UpgradeImageCard
                src="/rocks/electrical-box-cover-before.jpg"
                alt="Electrical box area before cover installation"
                label="Before"
              />
              <UpgradeImageCard
                src="/rocks/electrical-box-cover-after.jpg"
                alt="Electrical box area after cover installation"
                label="After"
              />
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
              Limited upgrade price
            </div>

            <div className="mt-4 flex items-end gap-3">
              <div className="text-lg text-white/35 line-through">
                {formatUsd(QR_UPSELL_ADDON_COMPARE_AT_CENTS)}
              </div>
              <div className="text-4xl font-semibold tracking-tight text-white">
                {formatUsd(QR_UPSELL_ADDON_PRICE_CENTS)}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/68">
              This optional add-on stays with the same order and checkout session.
              If you add it now, we’ll collect the electrical box photo and
              measurements in the next step.
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => continueToCheckout(true)}
                disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action === "add" ? "Redirecting…" : "Add to my order"}
              </button>

              <button
                type="button"
                onClick={() => continueToCheckout(false)}
                disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action === "skip" ? "Redirecting…" : "No thanks"}
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}

function UpgradeFallback() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading upgrade…</h1>
        </div>
      </div>
    </main>
  );
}

export default function QrUpgradePage() {
  return (
    <Suspense fallback={<UpgradeFallback />}>
      <QrUpgradePageInner />
    </Suspense>
  );
}
